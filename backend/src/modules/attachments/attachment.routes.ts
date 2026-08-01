import { FastifyInstance } from "fastify";
import { getSessionUser } from "@/lib/session.js";
import { prisma } from "@/lib/prisma.js";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import {
  querySchema,
  filenameSchema,
  extensionSchema,
  mimetypeSchema,
} from "./attachment.validations.js";
import { extractExtension, resolveFileType } from "./attachment.helpers.js";
import { attachmentService } from "./attachment.service.js";

export async function attachmentUploadRoutes(fastify: FastifyInstance) {
  // ── Upload an attachment to a task ──
  fastify.post("/attachments/upload", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) return reply.status(400).send({ message: "No file uploaded" });

      // ── Validation ──

      const queryResult = querySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          message: "Invalid query parameters",
          errors: queryResult.error.flatten().fieldErrors,
        });
      }
      const { taskId } = queryResult.data;

      const filenameResult = filenameSchema.safeParse(file.filename);
      if (!filenameResult.success) {
        return reply.status(400).send({
          message: filenameResult.error.issues[0]?.message ?? "Invalid filename",
        });
      }

      const ext = extractExtension(file.filename);
      const extResult = extensionSchema.safeParse(ext);
      if (!extResult.success) {
        return reply.status(400).send({ message: "Unsupported file extension" });
      }

      const mimeResult = mimetypeSchema.safeParse(file.mimetype);
      if (!mimeResult.success) {
        return reply.status(400).send({ message: "Invalid or unsupported file type" });
      }

      const typeKey = resolveFileType(file.mimetype, ext);
      if (!typeKey) {
        return reply.status(400).send({
          message: "File extension does not match its MIME type",
        });
      }

      const fileBuffer = await file.toBuffer();

      // ── Auth ──

      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      // ── Verify task exists & user is workspace member ──

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          column: {
            select: {
              board: {
                select: {
                  project: {
                    select: { workspaceId: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!task) {
        return reply.status(404).send({ message: "Task not found" });
      }

      const member = await workspaceService.getMember(
        task.column.board.project.workspaceId,
        user.id,
      );
      if (!member) {
        return reply.status(403).send({ message: "Not a member of this workspace" });
      }

      // ── Delegate to service ──

      const attachment = await attachmentService.upload(taskId, {
        filename: file.filename,
        mimetype: file.mimetype,
        buffer: fileBuffer,
      }, typeKey);

      return reply.status(201).send({
        message: "Attachment uploaded successfully",
        attachment: {
          id: attachment.id,
          name: attachment.name,
          url: attachment.url,
          createdAt: attachment.createdAt,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      const statusCode = error.statusCode ?? 500;
      return reply.status(statusCode).send({
        message: error.message ?? "Failed to upload attachment",
      });
    }
  });

  // ── Rename an attachment ──
  fastify.patch("/attachments/:id", async (request, reply) => {
    try {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      if (!id) return reply.status(400).send({ message: "Attachment ID is required." });

      const { name } = (request.body || {}) as { name?: string };
      if (!name || !name.trim()) {
        return reply.status(400).send({ message: "Name is required." });
      }
      if (name.length > 255) {
        return reply.status(400).send({ message: "Name too long." });
      }

      const updated = await attachmentService.rename(id, name.trim());
      if (!updated) {
        return reply.status(404).send({ message: "Attachment not found" });
      }

      return reply.send({
        message: "Attachment renamed",
        attachment: {
          id: updated.id,
          name: updated.name,
          url: updated.url,
          createdAt: updated.createdAt,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Failed to rename attachment" });
    }
  });

  // ── Delete an attachment ──
  fastify.delete("/attachments/:id", async (request, reply) => {
    try {
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      const { id } = request.params as { id: string };
      if (!id) return reply.status(400).send({ message: "Attachment ID is required." });

      const deleted = await attachmentService.delete(id);
      if (!deleted) {
        return reply.status(404).send({ message: "Attachment not found" });
      }

      return reply.status(204).send();
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ message: "Failed to delete attachment" });
    }
  });
}
