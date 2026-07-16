import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { projectService } from "@/modules/workspace/project.service.js";
import { boardService } from "@/modules/workspace/board/board.service.js";
import { taskService } from "@/modules/workspace/task/task.service.js";
import { getSessionUser } from "@/lib/session.js";
import { activityService } from "@/modules/workspace/task/activity.service.js";
import { publishActivity } from "@/lib/ably.js";
import { notify } from "@/lib/notify.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from "@/modules/workspace/task/task.service.js";

// ── Helpers ──

/** Log activity + publish to Ably. Skip if actor === target user. */
async function logActivity(params: {
  type: string;
  workspaceId: string;
  actorId: string;
  actor: { id: string; name: string; image?: string | null };
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
}) {
  activityService
    .log({
      type: params.type,
      workspaceId: params.workspaceId,
      actorId: params.actorId,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata,
    })
    .catch(() => {});
  publishActivity(params.workspaceId, {
    type: params.type,
    actor: params.actor,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata,
  });
}

/** Send notification. Skip if actor === recipient. */
async function sendNotif(params: {
  userId: string;
  actorId: string;
  workspaceId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, any>;
}) {
  if (params.userId === params.actorId) return;
  notify({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: params.type,
    title: params.title,
    body: params.body,
    metadata: params.metadata,
  }).catch(() => {});
}

export async function taskRoutes(fastify: FastifyInstance) {
  // ── Create task ──
  fastify.post("/api/columns/:columnId/tasks", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { columnId } = request.params as { columnId: string };
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { project: { select: { id: true, workspaceId: true } } },
        },
      },
    });
    if (!column)
      return reply.status(404).send({ message: "Column not found." });

    const member = await workspaceService.getMember(
      column.board.project.workspaceId,
      user.id,
    );
    if (!member) return reply.status(403).send({ message: "Not a member." });

    const { title, description, priority, dueDate, assigneeId } =
      request.body as CreateTaskInput;
    if (!title?.trim())
      return reply.status(400).send({ message: "Task title is required." });

    const task = await taskService.create(columnId, user.id, {
      title: title.trim(),
      description,
      priority,
      dueDate,
      assigneeId,
    });

    const wsId = column.board.project.workspaceId;
    const actor = {
      id: user.id,
      name: user.name || "Someone",
      image: user.image,
    };

    await logActivity({
      type: "created_task",
      workspaceId: wsId,
      actorId: user.id,
      actor,
      targetType: "task",
      targetId: task.id,
      metadata: {
        title: task.title,
        column: column.name,
        assigneeId: assigneeId || null,
      },
    });

    // Notify assignee
    if (assigneeId) {
      await sendNotif({
        userId: assigneeId,
        actorId: user.id,
        workspaceId: wsId,
        type: "assignment",
        title: `${actor.name} assigned you a task`,
        body: `"${task.title}" in ${column.name}`,
        metadata: {
          taskId: task.id,
          workspaceId: wsId,
          projectId: column.board.project.id,
        },
      });
    }

    return reply.status(201).send(task);
  });

  // ── Get single task ──
  fastify.get("/api/tasks/:id", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { id } = request.params as { id: string };
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        labels: true,
        subtasks: { orderBy: { order: "asc" } },
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        createdBy: { select: { id: true, name: true, image: true } },
        attachments: true,
        comments: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        column: {
          select: {
            name: true,
            board: {
              select: { project: { select: { id: true, workspaceId: true } } },
            },
          },
        },
      },
    });
    if (!task) return reply.status(404).send({ message: "Task not found." });
    return reply.send(task);
  });

  // ── Update task ──
  fastify.put("/api/tasks/:id", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { id } = request.params as { id: string };
    const old = await prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            board: {
              include: { project: { select: { id: true, workspaceId: true } } },
            },
          },
        },
      },
    });
    if (!old) return reply.status(404).send({ message: "Task not found." });

    const member = await workspaceService.getMember(
      old.column.board.project.workspaceId,
      user.id,
    );
    if (!member) return reply.status(403).send({ message: "Not a member." });

    const { title, description, priority, dueDate, assigneeId } =
      request.body as UpdateTaskInput;
    const wsId = old.column.board.project.workspaceId;
    const actor = {
      id: user.id,
      name: user.name || "Someone",
      image: user.image,
    };

    const updated = await taskService.update(id, user.id, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId,
    } as any);

    // Activity: task edited
    await logActivity({
      type: "updated_task",
      workspaceId: wsId,
      actorId: user.id,
      actor,
      targetType: "task",
      targetId: id,
      metadata: { title: updated.title },
    });

    // Notify on reassignment
    if (assigneeId && assigneeId !== old.assigneeId) {
      // Notify new assignee
      await sendNotif({
        userId: assigneeId,
        actorId: user.id,
        workspaceId: wsId,
        type: "assignment",
        title: `${actor.name} assigned you a task`,
        body: `"${updated.title}"`,
        metadata: {
          taskId: id,
          workspaceId: wsId,
          projectId: old.column.board.project.id,
        },
      });
      // Notify old assignee (reassigned away)
      if (old.assigneeId) {
        await sendNotif({
          userId: old.assigneeId,
          actorId: user.id,
          workspaceId: wsId,
          type: "reassigned",
          title: `${actor.name} reassigned "${updated.title}" away from you`,
          metadata: {
            taskId: id,
            workspaceId: wsId,
            projectId: old.column.board.project.id,
          },
        });
      }
    }

    return reply.send(updated);
  });

  // ── Move task ──
  fastify.put("/api/tasks/:id/move", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { id } = request.params as { id: string };
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        title: true,
        assigneeId: true,
        column: {
          select: {
            name: true,
            board: {
              select: { project: { select: { id: true, workspaceId: true } } },
            },
          },
        },
      },
    });
    if (!task) return reply.status(404).send({ message: "Task not found." });

    const member = await workspaceService.getMember(
      task.column.board.project.workspaceId,
      user.id,
    );
    if (!member) return reply.status(403).send({ message: "Not a member." });

    const { columnId, order } = request.body as MoveTaskInput;
    if (!columnId)
      return reply.status(400).send({ message: "columnId is required." });

    await taskService.move(id, { columnId, order });

    const wsId = task.column.board.project.workspaceId;
    const actor = {
      id: user.id,
      name: user.name || "Someone",
      image: user.image,
    };

    await logActivity({
      type: "moved_task",
      workspaceId: wsId,
      actorId: user.id,
      actor,
      targetType: "task",
      targetId: id,
      metadata: {
        toColumnId: columnId,
        taskTitle: task.title,
        assigneeId: task.assigneeId,
      },
    });

    // Notify on Done transitions
    if (task.assigneeId && task.assigneeId !== user.id) {
      const toCol = await prisma.column.findUnique({
        where: { id: columnId },
        select: { name: true },
      });
      const isDone = toCol?.name?.toLowerCase() === "done";
      const fromDone = task.column.name.toLowerCase() === "done";

      if (isDone || fromDone) {
        await sendNotif({
          userId: task.assigneeId,
          actorId: user.id,
          workspaceId: wsId,
          type: isDone ? "moved_to_done" : "moved_from_done",
          title: isDone
            ? `${actor.name} moved "${task.title}" to Done ✓`
            : `${actor.name} reopened "${task.title}"`,
          body: isDone
            ? undefined
            : `moved to ${toCol?.name || "another column"}`,
          metadata: {
            taskId: id,
            workspaceId: wsId,
            projectId: task.column.board.project.id,
          },
        });
      }
    }

    return reply.status(200).send({});
  });

  // ── Delete task ──
  fastify.delete("/api/tasks/:id", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { id } = request.params as { id: string };
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        title: true,
        column: {
          select: {
            board: { select: { project: { select: { workspaceId: true } } } },
          },
        },
      },
    });
    if (!task) return reply.status(404).send({ message: "Task not found." });

    const member = await workspaceService.getMember(
      task.column.board.project.workspaceId,
      user.id,
    );
    if (!member) return reply.status(403).send({ message: "Not a member." });

    await taskService.delete(id);

    await logActivity({
      type: "deleted_task",
      workspaceId: task.column.board.project.workspaceId,
      actorId: user.id,
      actor: { id: user.id, name: user.name || "Someone", image: user.image },
      targetType: "task",
      targetId: id,
      metadata: { title: task.title },
    });

    return reply.status(204).send();
  });

  // ── Labels ──
  fastify.post("/api/tasks/:taskId/labels", async (request, reply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });
    const { taskId } = request.params as { taskId: string };
    const { name, color } = request.body as { name: string; color?: string };
    if (!name?.trim())
      return reply.status(400).send({ message: "Label name required." });
    return reply.status(201).send(
      await prisma.taskLabel.create({
        data: { name: name.trim(), color: color || "#3B82F6", taskId },
      }),
    );
  });

  fastify.delete("/api/labels/:labelId", async (request, reply) => {
    if (!(await getSessionUser(request)))
      return reply.status(401).send({ message: "Unauthorized" });
    await prisma.taskLabel.delete({
      where: { id: (request.params as { labelId: string }).labelId },
    });
    return reply.status(204).send();
  });
}
