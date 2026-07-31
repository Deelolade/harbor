import { prisma } from "@/lib/prisma.js";
import crypto from "node:crypto";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createPersonalWorkspace(userId: string, userName: string) {
  const workspaceName = userName ? `${userName}'s Workspace` : "My Workspace";
  const avatarUrl = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(userName)}`;

  await Promise.all([
    prisma.user.update({ where: { id: userId }, data: { image: avatarUrl } }),
    prisma.workspace.create({
      data: {
        name: workspaceName,
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
    }),
  ]);
}
