import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma.js";
import { sendPasswordResetEmail } from "@/utils/email.js";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  FRONTEND_URL,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  BETTER_AUTH_URL,
  BACKEND_URL,
} from "@/utils/env.js";

console.log({
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL,
});
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: [FRONTEND_URL, "https://harbor.deelolade.com.ng","http://localhost:5173", ],
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      storeStateStrategy: "database",
    },
    github: {
      prompt: "select_account",
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      storeStateStrategy: "database",
    },
  },

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
});
