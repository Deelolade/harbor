import { auth } from "@/lib/auth.js";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import type { FastifyRequest, FastifyReply } from "fastify";

const handler = toNodeHandler(auth);

export async function authRoutes(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  return handler(request.raw, reply.raw);
}
