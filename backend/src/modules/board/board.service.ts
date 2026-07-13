import { prisma } from "../../lib/prisma.js";

export const boardService = {
  async listByProject(projectId: string) {
    return prisma.board.findMany({
      where: { projectId, archived: false },
      include: { columns: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
  },

  async create(projectId: string, name: string) {
    const last = await prisma.board.findFirst({ where: { projectId }, orderBy: { order: "desc" } });
    return prisma.board.create({
      data: { name, projectId, order: (last?.order ?? -1) + 1 },
      include: { columns: true },
    });
  },

  async update(boardId: string, data: { name?: string; archived?: boolean }) {
    return prisma.board.update({ where: { id: boardId }, data });
  },

  async delete(boardId: string) {
    return prisma.board.delete({ where: { id: boardId } });
  },

  async createColumn(boardId: string, name: string) {
    const last = await prisma.column.findFirst({ where: { boardId }, orderBy: { order: "desc" } });
    return prisma.column.create({ data: { name, boardId, order: (last?.order ?? -1) + 1 } });
  },

  async updateColumn(columnId: string, data: { name?: string }) {
    return prisma.column.update({ where: { id: columnId }, data });
  },

  async deleteColumn(columnId: string) {
    return prisma.column.delete({ where: { id: columnId } });
  },
};
