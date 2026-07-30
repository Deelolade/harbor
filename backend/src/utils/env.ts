import "dotenv/config";

export const COOKIE_SECRET = process.env.COOKIE_SECRET;
export const DATABASE_URL = process.env.DATABASE_URL;
export const SENDBYTE_SECRET = process.env.SENDBYTE_SECRET as string;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string;
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8800";
export const ABLY_API_KEY = process.env.ABLY_API_KEY as string;
export const PORT = Number(process.env.PORT) || 8800;

export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL as string;

// cloudflare setup
export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID as string;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID as string;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY as string;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME as string;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL as string;

export const NODE_ENV = process.env.NODE_ENV;


if (!DATABASE_URL) throw new Error("DATABASE_URL is missing");
if (!SENDBYTE_SECRET) throw new Error("SENDBYTE_SECRET is missing");
if (!ABLY_API_KEY) throw new Error("ABLY_API_KEY is missing");
if (!NODE_ENV) throw new Error("NODE_ENV is missing");
