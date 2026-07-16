import { prisma } from "@/lib/prisma.js";

export const activityService = {
  async log(params: {
    type: string;
    workspaceId: string;
    actorId: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.activity.create({
      data: {
        type: params.type,
        workspaceId: params.workspaceId,
        actorId: params.actorId,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ?? undefined,
      },
    });
  },

  async listByWorkspace(workspaceId: string, userId: string, limit = 50) {
    return prisma.activity.findMany({
      where: {
        workspaceId,
        // Don't show activities where the user is the actor
        NOT: { actorId: userId },
      },
      include: {
        actor: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async countUnseen(workspaceId: string, after: Date | null) {
    return prisma.activity.count({
      where: {
        workspaceId,
        ...(after ? { createdAt: { gt: after } } : {}),
      },
    });
  },
};
