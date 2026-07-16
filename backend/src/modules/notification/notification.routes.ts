import type { FastifyInstance, FastifyRequest } from "fastify";
import { auth } from "@/lib/auth.js";
import { listByUser, countUnread, markRead, markAllRead } from "@/lib/notify.js";

async function getUser(request: FastifyRequest) {
  const s = await auth.api.getSession({ headers: request.headers as HeadersInit });
  return s?.user ?? null;
}

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get("/api/notifications", async (request, reply) => {
    const user = await getUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    return reply.send(await listByUser(user.id));
  });

  fastify.get("/api/notifications/unread-count", async (request, reply) => {
    const user = await getUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    return reply.send({ count: await countUnread(user.id) });
  });

  fastify.post("/api/notifications/:id/read", async (request, reply) => {
    const user = await getUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { id } = request.params as { id: string };
    await markRead(id, user.id);
    return reply.send({ ok: true });
  });

  fastify.post("/api/notifications/read-all", async (request, reply) => {
    const user = await getUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    await markAllRead(user.id);
    return reply.send({ ok: true });
  });
}
