import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { workspaceService } from "../workspace.service.js";
import { boardService } from "../board/board.service.js";
import { taskService } from "./task.service.js";
import { subtaskService } from "./subtask.service.js";
import type {
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from "./subtask.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

export async function subtaskRoutes(fastify: FastifyInstance) {
  // ── Create subtask ──
  fastify.post(
    "/api/tasks/:taskId/subtasks",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { taskId } = request.params as { taskId: string };
      const task = await taskService.getById(taskId);
      if (!task) return reply.status(404).send({ message: "Task not found." });

      const board = await boardService.getById(task.column.boardId);
      const member = await workspaceService.getMember(
        board!.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { title } = request.body as CreateSubtaskInput;
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return reply
          .status(400)
          .send({ message: "Subtask title is required." });
      }

      const subtask = await subtaskService.create(taskId, {
        title: title.trim(),
      });
      return reply.status(201).send(subtask);
    },
  );

  // ── Update subtask ──
  fastify.put(
    "/api/subtasks/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const subtask = await prisma.subtask.findUnique({
        where: { id },
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
      if (!subtask)
        return reply.status(404).send({ message: "Subtask not found." });

      const member = await workspaceService.getMember(
        subtask.task.column.board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { title, completed } = request.body as UpdateSubtaskInput;
      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Subtask title cannot be empty." });
      }

      const updated = await subtaskService.update(id, { title, completed });
      return reply.send(updated);
    },
  );

  // ── Delete subtask ──
  fastify.delete(
    "/api/subtasks/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const subtask = await prisma.subtask.findUnique({
        where: { id },
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
      if (!subtask)
        return reply.status(404).send({ message: "Subtask not found." });

      const member = await workspaceService.getMember(
        subtask.task.column.board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      await subtaskService.delete(id);
      return reply.status(204).send();
    },
  );
}
