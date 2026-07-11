import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma.js";
import { sendPasswordResetEmail } from "../utils/email.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: "http://localhost:8800/",
  trustedOrigins: ["http://localhost:5173"],

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
