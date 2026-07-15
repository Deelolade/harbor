import { prisma } from "@/lib/prisma.js";

export interface CreateColumnInput {
  name: string;
  color?: string;
}

export interface UpdateColumnInput {
  name?: string;
  color?: string;
}

export interface ReorderColumnInput {
  columnIds: string[];
}

export const columnService = {
  /** Get a column with its board/project context for permission checks */
  async getById(columnId: string) {
    return prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: { include: { project: { select: { workspaceId: true } } } },
      },
    });
  },

  /** Create a column on a board */
  async create(boardId: string, input: CreateColumnInput) {
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastColumn?.order ?? -1) + 1;

    return prisma.column.create({
      data: {
        name: input.name.trim(),
        order: nextOrder,
        color: input.color,
        boardId,
      },
    });
  },

  /** Update a column */
  async update(columnId: string, input: UpdateColumnInput) {
    return prisma.column.update({
      where: { id: columnId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.color !== undefined ? { color: input.color } : {}),
      },
    });
  },

  /** Reorder columns */
  async reorder(columnIds: string[]) {
    await prisma.$transaction(
      columnIds.map((id, i) =>
        prisma.column.update({ where: { id }, data: { order: i } }),
      ),
    );
  },

  /** Delete a column */
  async delete(columnId: string) {
    return prisma.column.delete({ where: { id: columnId } });
  },
};
