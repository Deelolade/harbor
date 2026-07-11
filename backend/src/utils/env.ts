import "dotenv/config";
export const COOKIE_SECRET = process.env.COOKIE_SECRET;
export const DATABASE_URL = process.env.DATABASE_URL;
export const SENDBYTE_SECRET = process.env.SENDBYTE_SECRET as string;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

if (!SENDBYTE_SECRET) {
  throw new Error("SENDBYTE_SECRET is missing");
}

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is missing");
}

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is missing");
}
