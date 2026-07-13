import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { workspaceService } from "./workspace.service.js";
import { boardService } from "./board.service.js";
import { taskService } from "./task.service.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from "./task.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

export async function taskRoutes(fastify: FastifyInstance) {
  // ── Create task ──
  fastify.post(
    "/api/columns/:columnId/tasks",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { columnId } = request.params as { columnId: string };
      const board = await boardService.getById(
        (
          await prisma.column.findUnique({
            where: { id: columnId },
            select: { boardId: true },
          })
        )?.boardId || "",
      );
      if (!board)
        return reply.status(404).send({ message: "Column not found." });
      const member = await workspaceService.getMember(
        board.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { title, description, priority, dueDate, assigneeId } =
        request.body as CreateTaskInput;
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        return reply.status(400).send({ message: "Task title is required." });
      }

      const task = await taskService.create(columnId, user.id, {
        title: title.trim(),
        description,
        priority,
        dueDate,
        assigneeId,
      });
      return reply.status(201).send(task);
    },
  );

  // ── Update task ──
  fastify.put(
    "/api/tasks/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const task = await taskService.getById(id);
      if (!task) return reply.status(404).send({ message: "Task not found." });

      const board = await boardService.getById(task.column.boardId);
      const member = await workspaceService.getMember(
        board!.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { title, description, priority, dueDate, assigneeId } =
        request.body as UpdateTaskInput;
      if (
        title !== undefined &&
        (typeof title !== "string" || title.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Task title cannot be empty." });
      }

      const updated = await taskService.update(id, user.id, {
        title,
        description,
        priority,
        dueDate,
        assigneeId,
      });
      return reply.send(updated);
    },
  );

  // ── Move task ──
  fastify.put(
    "/api/tasks/:id/move",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const task = await taskService.getById(id);
      if (!task) return reply.status(404).send({ message: "Task not found." });

      const board = await boardService.getById(task.column.boardId);
      const member = await workspaceService.getMember(
        board!.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      const { columnId, order } = request.body as MoveTaskInput;
      if (!columnId)
        return reply.status(400).send({ message: "columnId is required." });

      const updated = await taskService.move(id, { columnId, order });
      return reply.send(updated);
    },
  );

  // ── Delete task ──
  fastify.delete(
    "/api/tasks/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      const task = await taskService.getById(id);
      if (!task) return reply.status(404).send({ message: "Task not found." });

      const board = await boardService.getById(task.column.boardId);
      const member = await workspaceService.getMember(
        board!.project.workspaceId,
        user.id,
      );
      if (!member) return reply.status(403).send({ message: "Not a member." });

      await taskService.delete(id);
      return reply.status(204).send();
    },
  );
}
