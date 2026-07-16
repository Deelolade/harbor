import { FastifyRequest } from "fastify";
import { auth } from "./auth.js";

/**
 * Get the current user from the request. Uses a WeakMap to cache
 * the session per-request, so it only hits the DB once.
 */
const sessionCache = new WeakMap<FastifyRequest, Promise<any>>();

export async function getSessionUser(request: FastifyRequest) {
  if (sessionCache.has(request)) return sessionCache.get(request)!;

  const promise = auth.api
    .getSession({
      headers: request.headers as HeadersInit,
    })
    .then((session) => session?.user ?? null);

  sessionCache.set(request, promise);
  return promise;
}
