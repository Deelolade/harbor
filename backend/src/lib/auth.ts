import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: prismaAdapter(),
  baseURL: "http://localhost:8800/",
  emailAndPassword: { enabled: true },
});
