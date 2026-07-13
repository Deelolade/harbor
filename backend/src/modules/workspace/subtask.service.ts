import { prisma } from "../../lib/prisma.js";

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
}

export const subtaskService = {
  async create(taskId: string, input: CreateSubtaskInput) {
    const last = await prisma.subtask.findFirst({
      where: { taskId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (last?.order ?? -1) + 1;

    return prisma.subtask.create({
      data: { title: input.title.trim(), order: nextOrder, taskId },
    });
  },

  async update(subtaskId: string, input: UpdateSubtaskInput) {
    return prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
      },
    });
  },

  async delete(subtaskId: string) {
    return prisma.subtask.delete({ where: { id: subtaskId } });
  },
};
