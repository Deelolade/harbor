import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { fromNodeHeaders } from "better-auth/node";
import { sendVerificationEmail } from "../../utils/email.js";
import { FRONTEND_URL } from "../../utils/env.js";
import crypto from "node:crypto";

const makeUrl = (path: string) => `${FRONTEND_URL}${path}`;

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Auto-create a personal workspace for a brand-new user.
 *  Only call this for self-service signups — never for invite-based signups. */
async function createPersonalWorkspace(userId: string, userName: string) {
  const workspaceName = userName ? `${userName}'s Workspace` : "My Workspace";

  await prisma.workspace.create({
    data: {
      name: workspaceName,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });
}

export const authRoutes = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // ── Normalize email to lowercase for all requests ──
    const body = request.body as Record<string, unknown> | undefined;
    if (body?.email && typeof body.email === "string") {
      body.email = body.email.toLowerCase().trim();
    }

    // ── Pre-check: duplicate email on sign-up ──
    if (request.method === "POST" && request.url.includes("/sign-up/email")) {
      const email = body?.email as string | undefined;
      if (email) {
        const existing = await prisma.user.findFirst({
          where: { email },
        });
        if (existing) {
          // If the account is unverified, resend the verification email
          if (!existing.emailVerified) {
            const token = generateToken();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await prisma.verification.create({
              data: {
                id: crypto.randomUUID(),
                identifier: email,
                value: token,
                expiresAt,
              },
            });

            const verifyUrl = makeUrl(`/verify-email?token=${token}`);
            sendVerificationEmail(email, verifyUrl).catch((err) =>
              request.log.error(err, "Failed to resend verification email"),
            );

            return reply.status(200).send({
              message:
                "This account already exists but is not verified. We've sent a new verification link to your email.",
              code: "RESENT_VERIFICATION",
            });
          }

          reply.status(400);
          return reply.send({
            message: "An account with this email already exists.",
            code: "EMAIL_EXISTS",
          });
        }
      }
    }

    // ── Resend verification manually ──
    if (
      request.method === "POST" &&
      request.url.includes("/resend-verification")
    ) {
      const email = body?.email as string | undefined;
      if (!email) {
        return reply.status(400).send({ message: "Email is required." });
      }

      const user = await prisma.user.findFirst({ where: { email } });
      if (!user || user.emailVerified) {
        // Don't reveal whether the email exists — always return success
        return reply.status(200).send({});
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: email,
          value: token,
          expiresAt,
        },
      });

      const verifyUrl = makeUrl(`/verify-email?token=${token}`);
      sendVerificationEmail(email, verifyUrl).catch((err) =>
        request.log.error(err, "Failed to send verification email"),
      );

      return reply.status(200).send({});
    }

    // ── Verify email manually ──
    if (request.method === "POST" && request.url.includes("/verify-email")) {
      const { token } = (body || {}) as { token?: string };
      if (!token) {
        return reply.status(400).send({ message: "Token is required." });
      }

      const record = await prisma.verification.findFirst({
        where: { value: token, expiresAt: { gt: new Date() } },
      });

      if (!record) {
        return reply
          .status(400)
          .send({ message: "Invalid or expired verification token." });
      }

      await prisma.user.updateMany({
        where: { email: record.identifier },
        data: { emailVerified: true },
      });

      await prisma.verification.delete({ where: { id: record.id } });

      return reply.status(200).send({});
    }

    // ── Forward to better-auth ──
    const url = new URL(request.url, `http://${request.headers.host}`);

    const req = new Request(url.toString(), {
      method: request.method,
      headers: fromNodeHeaders(request.headers),
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);

    // OAuth redirects need reply.redirect() to work in popups
    const location = response.headers.get("location");
    if (location && response.status >= 300 && response.status < 400) {
      // Copy Set-Cookie headers BEFORE redirecting — the browser needs the
      // session cookie so subsequent requests are authenticated.
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === "set-cookie") reply.header(key, value);
      });
      return reply.redirect(location, response.status);
    }

    reply.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "location") reply.header(key, value);
    });

    // ── After successful sign-up, send verification email ──
    if (
      request.method === "POST" &&
      request.url.includes("/sign-up/email") &&
      response.status === 200
    ) {
      const email = body?.email as string | undefined;
      if (email) {
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.verification.create({
          data: {
            id: crypto.randomUUID(),
            identifier: email,
            value: token,
            expiresAt,
          },
        });

        const verifyUrl = makeUrl(`/verify-email?token=${token}`);
        sendVerificationEmail(email, verifyUrl).catch((err) =>
          request.log.error(err, "Failed to send verification email"),
        );

        // Set DiceBear avatar + auto-create workspace in parallel
        const seed = (body?.name as string) || email;
        const avatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(seed)}`;
        const displayName = (body?.name as string) || email.split("@")[0];

        const user = await prisma.user.update({
          where: { email },
          data: { image: avatarUrl },
        });
        await createPersonalWorkspace(user.id, displayName);
      }
    }

    if (response.body) {
      const body = await response.text();
      return reply.send(body);
    }
    return reply.send(null);
  } catch (error: any) {
    request.log.error(error, "Auth route error");
    return reply.status(500).send({
      error: "Internal authentication error",
      code: "AUTH_FAILURE",
    });
  }
};
