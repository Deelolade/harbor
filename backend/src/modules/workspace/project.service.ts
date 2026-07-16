import { prisma } from "@/lib/prisma.js";
import type { ProjectVisibility } from "../../generated/prisma/client.js";

export interface CreateProjectInput {
  name: string;
  description?: string;
  image?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  image?: string;
  visibility?: ProjectVisibility;
}

export const projectService = {
  async create(workspaceId: string, userId: string, input: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        image: input.image,
        visibility: input.visibility ?? "WORKSPACE",
        workspaceId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  },

  async listByWorkspace(workspaceId: string) {
    return prisma.project.findMany({
      where: { workspaceId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        workspace: { select: { id: true, name: true } },
      },
    });
  },

  async update(projectId: string, input: UpdateProjectInput) {
    return prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() }
          : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.visibility !== undefined
          ? { visibility: input.visibility }
          : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  },

  async delete(projectId: string) {
    return prisma.project.delete({ where: { id: projectId } });
  },
};
