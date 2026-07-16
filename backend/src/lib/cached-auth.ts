import { FastifyInstance, FastifyRequest } from "fastify";
import { auth } from "../lib/auth.js";

export async function cachedAuth(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    let session: { user: { id: string; name: string; email?: string } } | null =
      null;
    let fetched = false;

    (request as any).getSession = async () => {
      if (fetched) return session;
      fetched = true;
      const result = await auth.api.getSession({
        headers: request.headers as HeadersInit,
      });
      if (result && "user" in result) {
        session = { user: result.user as any };
      }
      return session;
    };
  });
}
