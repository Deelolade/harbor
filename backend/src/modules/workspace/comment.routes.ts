import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { workspaceService } from "./workspace.service.js";
import { boardService } from "./board.service.js";
import { taskService } from "./task.service.js";
import { commentService } from "./comment.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({ headers: request.headers as HeadersInit });
  return session?.user ?? null;
}

export async function commentRoutes(fastify: FastifyInstance) {
  fastify.get("/api/tasks/:taskId/comments", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { taskId } = request.params as { taskId: string };
    return reply.send(await commentService.listByTask(taskId));
  });

  fastify.post("/api/tasks/:taskId/comments", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { taskId } = request.params as { taskId: string };
    const { content } = request.body as { content: string };
    if (!content?.trim()) return reply.status(400).send({ message: "Comment cannot be empty." });
    const comment = await commentService.create(taskId, user.id, content);
    return reply.status(201).send(comment);
  });

  fastify.put("/api/comments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };
    if (!content?.trim()) return reply.status(400).send({ message: "Comment cannot be empty." });
    return reply.send(await commentService.update(id, content));
  });

  fastify.delete("/api/comments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    await commentService.delete((request.params as { id: string }).id);
    return reply.status(204).send();
  });
}
