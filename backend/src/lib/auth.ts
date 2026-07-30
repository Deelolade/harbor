import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/utils/email.js";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from "@/utils/env.js";
import crypto from "node:crypto";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: FRONTEND_URL,
  trustedOrigins: [FRONTEND_URL, "http://localhost:5173"],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const name = user.name || user.email.split("@")[0];
            const workspaceName = `${name}'s Workspace`;

            const avatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(name)}`;

            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: { image: avatarUrl },
              }),
              prisma.workspace.create({
                data: {
                  name: workspaceName,
                  ownerId: user.id,
                  members: { create: { userId: user.id, role: "OWNER" } },
                },
              }),
            ]);

            if (!user.emailVerified) {
              const token = generateToken();
              await prisma.verification.create({
                data: {
                  id: crypto.randomUUID(),
                  identifier: user.email,
                  value: token,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
              });

              const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
              sendVerificationEmail(user.email, verifyUrl).catch(() => {});
            }
          } catch (err) {
            console.error("[auth] Post-signup hook failed:", err);
          }
        },
      },
    },
  },

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    },
    github: {
      prompt: "select_account",
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail(user.email, url);
      } catch (err) {
        console.error("[auth] Password reset email failed:", err);
      }
    },
  },
});
