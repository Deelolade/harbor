import { FastifyInstance } from "fastify";
import { auth } from "../../lib/auth.js";
import { FastifyRequest, FastifyReply } from "fastify";
import { fromNodeHeaders } from "better-auth/node";

export const authRoutes = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    const req = new Request(url.toString(), {
      method: request.method,
      headers: fromNodeHeaders(request.headers),
      ...(request.body ? { body: JSON.stringify(request.body) } : {}),
    });
    const response = await auth.handler(req);

    reply.status(response.status);
    response.headers.forEach((value, key) => reply.header(key, value));
    return reply.send(response.body ? await response.text() : null);
  } catch (error: any) {
    request.log.error("Authentication Error:", error);
    return reply.status(500).send({
      error: "Internal authentication error",
      code: "AUTH_FAILURE",
    });
  }
};
