import { auth } from "@/lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { FRONTEND_URL } from "@/utils/env.js";
import type { FastifyRequest, FastifyReply } from "fastify";

export async function authRoutes(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const url = new URL(request.url, FRONTEND_URL);

  const response = await auth.handler(
    new Request(url, {
      method: request.method,
      headers: fromNodeHeaders(request.headers),
      body: request.method !== "GET" && request.method !== "HEAD"
        ? JSON.stringify(request.body ?? {})
        : undefined,
    }),
  );

  const location = response.headers.get("location");
  if (location && response.status >= 300 && response.status < 400) {
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") reply.header(key, value);
    });
    return reply.redirect(location, response.status);
  }

  reply.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "location") reply.header(key, value);
  });

  if (response.body) {
    return reply.send(await response.text());
  }
  return reply.send(null);
}
