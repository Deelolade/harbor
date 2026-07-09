import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { PrismaPg } from "@prisma/adapter-pg";
import { DATABASE_URL } from "../utils/env.js";
import { prisma } from "./prisma.js";



export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: "http://localhost:8800/",
  emailAndPassword: { enabled: true, autoSignIn: false },
  trustedOrigins: ["http://localhost:5173"],
});
