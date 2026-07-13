import { prisma } from "../../lib/prisma.js";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

export interface CreateBoardInput {
  name: string;
}

export interface UpdateBoardInput {
  name?: string;
  archived?: boolean;
}

export interface ReorderBoardInput {
  boardIds: string[]; // ordered list of board IDs
}

export const boardService = {
  /** Create a board with default columns */
  async create(projectId: string, input: CreateBoardInput) {
    // Get the next order position
    const lastBoard = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (lastBoard?.order ?? -1) + 1;

    return prisma.board.create({
      data: {
        name: input.name.trim(),
        order: nextOrder,
        projectId,
        columns: {
          create: DEFAULT_COLUMNS.map((name, i) => ({ name, order: i })),
        },
      },
      include: {
        columns: { orderBy: { order: "asc" } },
      },
    });
  },

  /** List boards for a project */
  async listByProject(projectId: string) {
    return prisma.board.findMany({
      where: { projectId },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: {
                subtasks: { orderBy: { order: "asc" } },
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
                createdBy: {
                  select: { id: true, name: true, email: true, image: true },
                },
                updatedBy: {
                  select: { id: true, name: true, email: true, image: true },
                },
                labels: true,
                attachments: true,
                comments: {
                  orderBy: { createdAt: "asc" },
                  include: {
                    author: { select: { id: true, name: true, image: true } },
                  },
                },
                column: { select: { id: true, name: true, boardId: true } },
              },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });
  },

  /** Get a board with its columns */
  async getById(boardId: string) {
    return prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: { orderBy: { order: "asc" } },
        project: { select: { id: true, name: true, workspaceId: true } },
      },
    });
  },

  /** Update board name or archive status */
  async update(boardId: string, input: UpdateBoardInput) {
    return prisma.board.update({
      where: { id: boardId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.archived !== undefined ? { archived: input.archived } : {}),
      },
    });
  },

  /** Reorder boards */
  async reorder(boardIds: string[]) {
    await prisma.$transaction(
      boardIds.map((id, i) =>
        prisma.board.update({ where: { id }, data: { order: i } }),
      ),
    );
  },

  /** Delete a board */
  async delete(boardId: string) {
    return prisma.board.delete({ where: { id: boardId } });
  },
};
