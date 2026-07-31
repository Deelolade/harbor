import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";
import { sendVerificationEmail } from "@/utils/email.js";
import { FRONTEND_URL } from "@/utils/env.js";
import { getSessionUser } from "@/lib/session.js";
import {
  profileSchema,
  changeEmailSchema,
  confirmEmailChangeSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  completeSignupSchema,
} from "./account.validations.js";
import { generateToken, createPersonalWorkspace } from "./account.service.js";

export async function accountRoutes(fastify: FastifyInstance) {
  // ── Update profile (name + avatar) ──
  fastify.put("/api/account/profile", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const result = profileSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Validation failed", errors: result.error.flatten().fieldErrors });

    const { name, image } = result.data;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim(), image: image ?? null },
    });

    return reply.status(200).send({ id: updated.id, name: updated.name, email: updated.email, image: updated.image });
  });

  // ── Change email (initiate) ──
  fastify.post("/api/account/change-email", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const result = changeEmailSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Validation failed", errors: result.error.flatten().fieldErrors });

    const newEmail = result.data.newEmail.toLowerCase().trim();
    if (newEmail === user.email) return reply.status(400).send({ message: "New email is the same as current." });

    const existing = await prisma.user.findFirst({ where: { email: newEmail } });
    if (existing) return reply.status(409).send({ message: "This email is already in use." });

    const token = generateToken();
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: `email-change:${user.id}:${newEmail}`,
        value: token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const confirmUrl = `${FRONTEND_URL}/confirm-email-change?token=${token}`;
    sendVerificationEmail(newEmail, confirmUrl).catch((err) => request.log.error(err));

    return reply.status(200).send({ message: "Confirmation email sent." });
  });

  // ── Confirm email change ──
  fastify.post("/api/account/confirm-email-change", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = confirmEmailChangeSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Validation failed", errors: result.error.flatten().fieldErrors });

    const record = await prisma.verification.findFirst({
      where: { value: result.data.token, expiresAt: { gt: new Date() } },
    });

    if (!record || !record.identifier.startsWith("email-change:")) {
      return reply.status(400).send({ message: "Invalid or expired token." });
    }

    const [, userId, newEmail] = record.identifier.split(":");
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { email: newEmail, emailVerified: true } }),
      prisma.verification.delete({ where: { id: record.id } }),
    ]);

    return reply.status(200).send({ message: "Email changed successfully." });
  });

  // ── Change password ──
  fastify.post("/api/account/change-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const result = changePasswordSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Validation failed", errors: result.error.flatten().fieldErrors });

    const { currentPassword, newPassword } = result.data;

    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (!account?.password) {
      return reply.status(400).send({ message: "No password set. You may have signed in with Google or GitHub." });
    }

    const { auth } = await import("@/lib/auth.js");
    const ctx = await auth.$context;

    const isValid = await ctx.password.verify({ hash: account.password, password: currentPassword });
    if (!isValid) return reply.status(400).send({ message: "Current password is incorrect." });

    const hashed = await ctx.password.hash(newPassword);
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });

    return reply.status(200).send({ message: "Password changed successfully." });
  });

  // ── Verify email ──
  fastify.post("/api/account/verify-email", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = verifyEmailSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Token is required." });

    const record = await prisma.verification.findFirst({
      where: { value: result.data.token, expiresAt: { gt: new Date() } },
    });

    if (!record) return reply.status(400).send({ message: "Invalid or expired verification token." });

    await prisma.$transaction([
      prisma.user.updateMany({ where: { email: record.identifier }, data: { emailVerified: true } }),
      prisma.verification.delete({ where: { id: record.id } }),
    ]);

    return reply.status(200).send({});
  });

  // ── Resend verification ──
  fastify.post("/api/account/resend-verification", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = resendVerificationSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "Email is required." });

    const email = result.data.email.toLowerCase().trim();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || user.emailVerified) return reply.status(200).send({});

    const token = generateToken();
    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier: email,
        value: token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
    sendVerificationEmail(email, verifyUrl).catch((err) => request.log.error(err));

    return reply.status(200).send({});
  });

  // ── Complete signup ──
  fastify.post("/api/account/complete-signup", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = completeSignupSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send({ message: "userId is required." });

    try {
      await createPersonalWorkspace(result.data.userId, result.data.name || result.data.email || "");
      return reply.status(200).send({ ok: true });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to complete signup." });
    }
  });
}
