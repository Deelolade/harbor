import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "@/lib/auth.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { projectService } from "@/modules/workspace/project.service.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/modules/workspace/project.service.js";

async function getSessionUser(request: FastifyRequest) {
  const session = await auth.api.getSession({
    headers: request.headers as HeadersInit,
  });
  return session?.user ?? null;
}

async function requireMembership(
  workspaceId: string,
  userId: string,
  reply: FastifyReply,
) {
  const member = await workspaceService.getMember(workspaceId, userId);
  if (!member) {
    reply
      .status(403)
      .send({ message: "You are not a member of this workspace." });
    return null;
  }
  return member;
}

export async function projectRoutes(fastify: FastifyInstance) {
  // ── Create project ──
  fastify.post(
    "/api/workspaces/:id/projects",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id, reply);
      if (!member) return;

      const { name, description, image, visibility } =
        request.body as CreateProjectInput;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return reply.status(400).send({ message: "Project name is required." });
      }

      if (
        visibility &&
        !["PRIVATE", "WORKSPACE", "PUBLIC"].includes(visibility)
      ) {
        return reply.status(400).send({
          message: "Visibility must be PRIVATE, WORKSPACE, or PUBLIC.",
        });
      }

      const project = await projectService.create(id, user.id, {
        name: name.trim(),
        description,
        image,
        visibility,
      });

      return reply.status(201).send(project);
    },
  );

  // ── List workspace projects ──
  fastify.get(
    "/api/workspaces/:id/projects",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const member = await requireMembership(id, user.id, reply);
      if (!member) return;

      const projects = await projectService.listByWorkspace(id);
      return reply.send(projects);
    },
  );

  // ── Get project by ID ──
  fastify.get(
    "/api/projects/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const project = await projectService.getById(id);
      if (!project) {
        return reply.status(404).send({ message: "Project not found." });
      }

      // Check membership in the parent workspace
      const member = await requireMembership(
        project.workspaceId,
        user.id,
        reply,
      );
      if (!member) return;

      return reply.send(project);
    },
  );

  // ── Update project ──
  fastify.put(
    "/api/projects/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const project = await projectService.getById(id);
      if (!project) {
        return reply.status(404).send({ message: "Project not found." });
      }

      const member = await requireMembership(
        project.workspaceId,
        user.id,
        reply,
      );
      if (!member) return;

      // Only admin/owner or the project creator can update
      const canManage =
        member.role === "OWNER" ||
        member.role === "ADMIN" ||
        project.createdById === user.id;
      if (!canManage) {
        return reply.status(403).send({
          message: "You don't have permission to update this project.",
        });
      }

      const { name, description, image, visibility } =
        request.body as UpdateProjectInput;

      if (
        name !== undefined &&
        (typeof name !== "string" || name.trim().length === 0)
      ) {
        return reply
          .status(400)
          .send({ message: "Project name cannot be empty." });
      }

      if (
        visibility &&
        !["PRIVATE", "WORKSPACE", "PUBLIC"].includes(visibility)
      ) {
        return reply.status(400).send({
          message: "Visibility must be PRIVATE, WORKSPACE, or PUBLIC.",
        });
      }

      const updated = await projectService.update(id, {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
      });

      return reply.send(updated);
    },
  );

  // ── Delete project ──
  fastify.delete(
    "/api/projects/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const { id } = request.params as { id: string };
      const project = await projectService.getById(id);
      if (!project) {
        return reply.status(404).send({ message: "Project not found." });
      }

      const member = await requireMembership(
        project.workspaceId,
        user.id,
        reply,
      );
      if (!member) return;

      // Only admin/owner or the project creator can delete
      const canManage =
        member.role === "OWNER" ||
        member.role === "ADMIN" ||
        project.createdById === user.id;
      if (!canManage) {
        return reply.status(403).send({
          message: "You don't have permission to delete this project.",
        });
      }

      await projectService.delete(id);
      return reply.status(204).send();
    },
  );
}
