import { prisma } from "@/lib/prisma.js";

export const commentService = {
  async listByTask(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });
  },

  async create(taskId: string, authorId: string, content: string) {
    return prisma.comment.create({
      data: { content: content.trim(), taskId, authorId },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
  },

  async update(commentId: string, content: string) {
    return prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { author: { select: { id: true, name: true, image: true } } },
    });
  },

  async delete(commentId: string) {
    return prisma.comment.delete({ where: { id: commentId } });
  },
};
