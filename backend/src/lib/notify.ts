import { prisma } from "@/lib/prisma.js";

export async function notify(params: {
  userId: string;
  workspaceId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, any>;
}) {
  return prisma.notification.create({ data: params });
}

export async function listByUser(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
