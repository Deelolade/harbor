import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma.js";
import { sendPasswordResetEmail } from "@/utils/email.js";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  BACKEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
} from "@/utils/env.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: BACKEND_URL,
  trustedOrigins: [FRONTEND_URL],

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Sending password reset to ${user.email}`);
      try {
        await sendPasswordResetEmail(user.email, url);
      } catch (err) {
        console.error("[auth] Password reset email failed:", err);
      }
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
});
