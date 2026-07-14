import { FastifyInstance, FastifyRequest } from "fastify";
import { auth } from "../lib/auth.js";

/**
 * Fastify plugin that decorates every request with a cached getSession().
 * The session is fetched once per request and cached for subsequent calls,
 * eliminating duplicate DB hits for auth checks within the same request.
 */
export async function cachedAuth(fastify: FastifyInstance) {
  fastify.decorateRequest(
    "getSession",
    undefined as unknown as FastifyRequest["getSession"],
  );

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    let session: { user: { id: string; name: string; email?: string } } | null =
      null;
    let fetched = false;

    request.getSession = async () => {
      if (fetched) return session;
      fetched = true;
      const result = await auth.api.getSession({
        headers: request.headers as HeadersInit,
      });
      session =
        result && "user" in result ? { user: result.user as any } : null;
      return session;
    };
  });
}

declare module "fastify" {
  interface FastifyRequest {
    getSession: () => Promise<{
      user: { id: string; name: string; email?: string };
    } | null>;
  }
}
