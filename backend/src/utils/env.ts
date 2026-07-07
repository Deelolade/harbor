import "dotenv/config";
export const COOKIE_SECRET = process.env.COOKIE_SECRET;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}
