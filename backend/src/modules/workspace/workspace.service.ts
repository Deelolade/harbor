import { prisma } from "@/lib/prisma.js";
import type { WorkspaceRole } from "../../generated/prisma/client.js";

export interface CreateWorkspaceInput {
  name: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
}

export interface AddMemberInput {
  userId: string;
  role?: WorkspaceRole;
}

export interface UpdateMemberInput {
  role: WorkspaceRole;
}

export const workspaceService = {
  /** Create a new workspace and add the creator as OWNER */
  async create(userId: string, input: CreateWorkspaceInput) {
    return prisma.workspace.create({
      data: {
        name: input.name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });
  },

  /**
   * Safety net: if a user has zero workspaces (e.g. OAuth sign-up,
   * or workspace creation failed during email sign-up), auto-create
   * a personal workspace.  Invite-only sign-ups already have a
   * membership so this won't fire for them.
   */
  async ensurePersonalWorkspace(userId: string, userName: string) {
    const count = await prisma.workspaceMember.count({ where: { userId } });
    if (count > 0) return null;

    const workspaceName = userName ? `${userName}'s Workspace` : "My Workspace";

    return prisma.workspace.create({
      data: {
        name: workspaceName,
        ownerId: userId,
        members: { create: { userId, role: "OWNER" } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { members: true } },
      },
    });
  },

  /** List all workspaces the user belongs to */
  async listByUser(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Get a single workspace by ID with members */
  async getById(workspaceId: string) {
    return prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  },

  /** Update workspace name */
  async update(workspaceId: string, input: UpdateWorkspaceInput) {
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: input,
    });
  },

  /** Delete a workspace */
  async delete(workspaceId: string) {
    return prisma.workspace.delete({
      where: { id: workspaceId },
    });
  },

  /** Get a member record for a user in a workspace */
  async getMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
  },

  /** Add a member to a workspace */
  async addMember(workspaceId: string, input: AddMemberInput) {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: input.userId,
        role: input.role ?? "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  },

  /** List all members of a workspace */
  async listMembers(workspaceId: string) {
    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
  },

  /** Update a member's role */
  async updateMember(memberId: string, input: UpdateMemberInput) {
    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: input.role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  },

  /** Remove a member from a workspace */
  async removeMember(memberId: string) {
    return prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  },
};
