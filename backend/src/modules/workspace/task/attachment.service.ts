import { prisma } from "@/lib/prisma.js";

export const attachmentService = {
  async create(taskId: string, data: { name: string; url: string }) {
    return prisma.attachment.create({
      data: {
        name: data.name,
        url: data.url,
        taskId,
      },
    });
  },

  async listByTask(taskId: string) {
    return prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });
  },

  async listByProject(projectId: string) {
    return prisma.attachment.findMany({
      where: {
        task: {
          column: {
            board: { projectId },
          },
        },
      },
      include: {
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.attachment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            column: {
              select: {
                board: {
                  select: { projectId: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async delete(id: string) {
    return prisma.attachment.delete({ where: { id } });
  },
};
