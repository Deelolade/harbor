import { FastifyRequest } from "fastify";

/** Get the current user from the request-scoped cached session.
 *  Uses request.getSession() (set by cachedAuth plugin) which only hits
 *  the DB once per request, even if called multiple times. */
export async function getSessionUser(request: FastifyRequest) {
  const session = await request.getSession();
  return session?.user ?? null;
}
