import { prisma } from "../../lib/prisma.js";
import type { Priority } from "../../generated/prisma/client/index.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: string;
  labels?: { name: string; color?: string }[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface MoveTaskInput {
  columnId: string;
  order: number;
}

const taskInclude = {
  subtasks: { orderBy: { order: "asc" as const } },
  assignee: { select: { id: true, name: true, email: true, image: true } },
  createdBy: { select: { id: true, name: true, email: true, image: true } },
  updatedBy: { select: { id: true, name: true, email: true, image: true } },
  labels: true,
  attachments: true,
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, name: true, image: true } } },
  },
  column: {
    select: {
      id: true,
      name: true,
      boardId: true,
      board: { select: { project: { select: { workspaceId: true } } } },
    },
  },
};

export const taskService = {
  async create(columnId: string, userId: string, input: CreateTaskInput) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return prisma.task.create({
      data: {
        title: input.title.trim(),
        description: input.description,
        priority: input.priority ?? "MEDIUM",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        order: (lastTask?.order ?? -1) + 1,
        columnId,
        createdById: userId,
        assigneeId: input.assigneeId,
        labels: input.labels?.length
          ? {
              create: input.labels.map((l) => ({
                name: l.name,
                color: l.color ?? "#3B82F6",
              })),
            }
          : undefined,
      },
      include: taskInclude,
    });
  },

  async listByColumn(columnId: string) {
    return prisma.task.findMany({
      where: { columnId },
      include: taskInclude,
      orderBy: { order: "asc" },
    });
  },

  async getById(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: taskInclude,
    });
  },

  async update(taskId: string, userId: string, input: UpdateTaskInput) {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
          : {}),
        ...(input.assigneeId !== undefined
          ? { assigneeId: input.assigneeId }
          : {}),
        updatedById: userId,
      },
      include: taskInclude,
    });
  },

  /** Move a task to a different column / reorder (lightweight, no full include) */
  async move(taskId: string, input: MoveTaskInput) {
    return prisma.task.update({
      where: { id: taskId },
      data: { columnId: input.columnId, order: input.order },
    });
  },

  async delete(taskId: string) {
    return prisma.task.delete({ where: { id: taskId } });
  },

  // Labels
  async addLabel(taskId: string, name: string, color?: string) {
    return prisma.taskLabel.create({
      data: { name: name.trim(), color: color ?? "#3B82F6", taskId },
    });
  },

  async removeLabel(labelId: string) {
    return prisma.taskLabel.delete({ where: { id: labelId } });
  },
};
