import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { boardService } from "./board.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: request.headers as HeadersInit });
  return session?.user ?? null;
}

export async function boardRoutes(fastify: FastifyInstance) {
  // ── List boards ──
  fastify.get("/api/projects/:projectId/boards", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { projectId } = request.params as { projectId: string };
    return reply.send(await boardService.listByProject(projectId));
  });

  // ── Create board ──
  fastify.post("/api/projects/:projectId/boards", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { projectId } = request.params as { projectId: string };
    const { name } = request.body as { name: string };
    if (!name?.trim()) return reply.status(400).send({ message: "Board name is required." });
    return reply.status(201).send(await boardService.create(projectId, name.trim()));
  });

  // ── Update board ──
  fastify.put("/api/boards/:boardId", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { boardId } = request.params as { boardId: string };
    const { name, archived } = request.body as { name?: string; archived?: boolean };
    return reply.send(await boardService.update(boardId, { name, archived }));
  });

  // ── Delete board ──
  fastify.delete("/api/boards/:boardId", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { boardId } = request.params as { boardId: string };
    await boardService.delete(boardId);
    return reply.status(204).send();
  });

  // ── Create column ──
  fastify.post("/api/boards/:boardId/columns", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { boardId } = request.params as { boardId: string };
    const { name } = request.body as { name: string };
    if (!name?.trim()) return reply.status(400).send({ message: "Column name is required." });
    return reply.status(201).send(await boardService.createColumn(boardId, name.trim()));
  });

  // ── Update column ──
  fastify.put("/api/columns/:columnId", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { columnId } = request.params as { columnId: string };
    const { name } = request.body as { name: string };
    if (!name?.trim()) return reply.status(400).send({ message: "Column name is required." });
    return reply.send(await boardService.updateColumn(columnId, { name: name.trim() }));
  });

  // ── Delete column ──
  fastify.delete("/api/columns/:columnId", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { columnId } = request.params as { columnId: string };
    await boardService.deleteColumn(columnId);
    return reply.status(204).send();
  });
}
