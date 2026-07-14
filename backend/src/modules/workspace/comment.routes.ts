import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { workspaceService } from "./workspace.service.js";
import { commentService } from "./comment.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

/** Verify user is workspace member via task → column → board → project → workspaceId chain */
async function requireTaskMember(
  taskId: string,
  userId: string,
  reply: FastifyReply,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      column: {
        include: {
          board: { include: { project: { select: { workspaceId: true } } } },
        },
      },
    },
  });
  if (!task) {
    reply.status(404).send({ message: "Task not found." });
    return null;
  }
  const member = await workspaceService.getMember(
    task.column.board.project.workspaceId,
    userId,
  );
  if (!member) {
    reply.status(403).send({ message: "Not a member." });
    return null;
  }
  return task;
}

/** Verify user is workspace member for a comment (via comment → task chain) */
async function requireCommentMember(
  commentId: string,
  userId: string,
  reply: FastifyReply,
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      task: {
        include: {
          column: {
            include: {
              board: {
                include: { project: { select: { workspaceId: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!comment) {
    reply.status(404).send({ message: "Comment not found." });
    return null;
  }
  const member = await workspaceService.getMember(
    comment.task.column.board.project.workspaceId,
    userId,
  );
  if (!member) {
    reply.status(403).send({ message: "Not a member." });
    return null;
  }
  return comment;
}

export async function commentRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/tasks/:taskId/comments",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { taskId } = request.params as { taskId: string };
      const task = await requireTaskMember(taskId, user.id, reply);
      if (!task) return;
      return reply.send(await commentService.listByTask(taskId));
    },
  );

  fastify.post(
    "/api/tasks/:taskId/comments",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { taskId } = request.params as { taskId: string };
      const task = await requireTaskMember(taskId, user.id, reply);
      if (!task) return;
      const { content } = request.body as { content: string };
      if (!content?.trim())
        return reply.status(400).send({ message: "Comment cannot be empty." });
      const comment = await commentService.create(taskId, user.id, content);
      return reply.status(201).send(comment);
    },
  );

  fastify.put(
    "/api/comments/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      const comment = await requireCommentMember(id, user.id, reply);
      if (!comment) return;
      const { content } = request.body as { content: string };
      if (!content?.trim())
        return reply.status(400).send({ message: "Comment cannot be empty." });
      return reply.send(await commentService.update(id, content));
    },
  );

  fastify.delete(
    "/api/comments/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });
      const { id } = request.params as { id: string };
      const comment = await requireCommentMember(id, user.id, reply);
      if (!comment) return;
      await commentService.delete(id);
      return reply.status(204).send();
    },
  );
}
