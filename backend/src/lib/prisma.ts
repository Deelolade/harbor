import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
