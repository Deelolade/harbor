import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { fromNodeHeaders } from "better-auth/node";

export const authRoutes = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // ── Pre-check: duplicate email on sign-up ──
    if (request.method === "POST" && request.url.includes("/sign-up/email")) {
      const body = request.body as { email?: string } | undefined;
      if (body?.email) {
        const existing = await prisma.user.findUnique({
          where: { email: body.email },
        });
        if (existing) {
          reply.status(400);
          return reply.send({
            message: "An account with this email already exists.",
            code: "EMAIL_EXISTS",
          });
        }
      }
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    const req = new Request(url.toString(), {
      method: request.method,
      headers: fromNodeHeaders(request.headers),
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });

    const response = await auth.handler(req);

    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));

    if (response.body) {
      const body = await response.text();
      return reply.send(body);
    }
    return reply.send(null);
  } catch (error: any) {
    request.log.error(error, "Auth route error");

    if (error?.body || error?.status) {
      reply.status(error.status || 500);
      return reply.send(error.body || { error: "Authentication error" });
    }

    return reply.status(500).send({
      error: "Internal authentication error",
      code: "AUTH_FAILURE",
    });
  }
};
