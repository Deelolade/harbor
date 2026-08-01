import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma.js";
import { getSessionUser } from "@/lib/session.js";
import { attachmentService } from "./attachment.service.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { z } from "zod";

const createAttachmentSchema = z.object({
  name: z.string().min(1, "File name is required").max(255, "File name too long"),
  url: z.string().min(1, "File URL is required").max(2048, "File URL too long"),
});

export async function attachmentRoutes(fastify: FastifyInstance) {
  // ── List attachments for a task ──
  fastify.get("/api/tasks/:taskId/attachments", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { taskId } = request.params as { taskId: string };
    if (!taskId) return reply.status(400).send({ message: "Task ID is required." });

    try {
      const attachments = await attachmentService.listByTask(taskId);
      return reply.send(attachments);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to load attachments." });
    }
  });

  // ── List all attachments across a project ──
  fastify.get("/api/projects/:projectId/attachments", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { projectId } = request.params as { projectId: string };
    if (!projectId) return reply.status(400).send({ message: "Project ID is required." });

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true },
      });
      if (!project) return reply.status(404).send({ message: "Project not found." });

      const member = await workspaceService.getMember(project.workspaceId, user.id);
      if (!member) return reply.status(403).send({ message: "You are not a member of this workspace." });

      const attachments = await attachmentService.listByProject(projectId);
      return reply.send(attachments);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to load project files." });
    }
  });

  // ── Create attachment ──
  fastify.post("/api/tasks/:taskId/attachments", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { taskId } = request.params as { taskId: string };
    if (!taskId) return reply.status(400).send({ message: "Task ID is required." });

    const bodyResult = createAttachmentSchema.safeParse(request.body || {});
    if (!bodyResult.success) {
      return reply.status(400).send({
        message: "Validation failed.",
        errors: bodyResult.error.flatten().fieldErrors,
      });
    }

    try {
      const attachment = await attachmentService.create(taskId, {
        name: bodyResult.data.name.trim(),
        url: bodyResult.data.url.trim(),
      });
      return reply.status(201).send(attachment);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to attach file." });
    }
  });

  // ── Delete attachment ──
  fastify.delete("/api/attachments/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getSessionUser(request);
    if (!user) return reply.status(401).send({ message: "Unauthorized" });

    const { id } = request.params as { id: string };
    if (!id) return reply.status(400).send({ message: "Attachment ID is required." });

    try {
      const attachment = await attachmentService.getById(id);
      if (!attachment) return reply.status(404).send({ message: "Attachment not found." });

      await attachmentService.delete(id);
      return reply.status(204).send();
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({ message: "Failed to delete attachment." });
    }
  });
}
