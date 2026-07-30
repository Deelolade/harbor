import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";
import { sendVerificationEmail } from "@/utils/email.js";
import { FRONTEND_URL } from "@/utils/env.js";
import crypto from "node:crypto";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createPersonalWorkspace(userId: string, userName: string) {
  const workspaceName = userName ? `${userName}'s Workspace` : "My Workspace";

  const seed = userName || userId;
  const avatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(seed)}`;

  // Set avatar + create workspace in parallel
  await Promise.all([
    prisma.user.update({
      where: { id: userId },
      data: { image: avatarUrl },
    }),
    prisma.workspace.create({
      data: {
        name: workspaceName,
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
    }),
  ]);
}

export async function accountRoutes(fastify: FastifyInstance) {
  // ── Verify email ──
  fastify.post("/api/account/verify-email", async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = (request.body || {}) as { token?: string };
    if (!token) {
      return reply.status(400).send({ message: "Token is required." });
    }

    const record = await prisma.verification.findFirst({
      where: { value: token, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      return reply.status(400).send({ message: "Invalid or expired verification token." });
    }

    await prisma.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: true },
    });

    await prisma.verification.delete({ where: { id: record.id } });

    return reply.status(200).send({});
  });

  // ── Resend verification ──
  fastify.post("/api/account/resend-verification", async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = (request.body || {}) as { email?: string };
    if (!email) {
      return reply.status(400).send({ message: "Email is required." });
    }

    const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!user || user.emailVerified) {
      // Don't reveal whether the email exists — always return success
      return reply.status(200).send({});
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email.toLowerCase().trim(),
        value: token,
        expiresAt,
      },
    });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    sendVerificationEmail(email, verifyUrl).catch((err) =>
      request.log.error(err, "Failed to send verification email"),
    );

    return reply.status(200).send({});
  });

  // ── Complete signup (create workspace + avatar) ──
  fastify.post("/api/account/complete-signup", async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId, name, email } = (request.body || {}) as {
      userId?: string;
      name?: string;
      email?: string;
    };
    if (!userId) {
      return reply.status(400).send({ message: "userId is required." });
    }

    try {
      await createPersonalWorkspace(userId, name || email || "");
      return reply.status(200).send({ ok: true });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to complete signup." });
    }
  });
}
