import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { getSessionUser } from "@/lib/session.js";
import { prisma } from "@/lib/prisma.js";
import {
  querySchema,
  filenameSchema,
  extensionSchema,
  mimetypeSchema,
  fileSizeSchema,
} from "./upload.validations.js";
import { keyFromUrl, extractExtension, validateMagicBytes } from "./upload.helpers.js";

export const uploadRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/upload/image", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) return reply.status(400).send({ message: "No file uploaded" });

      // Validate query params
      const queryResult = querySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          message: "Invalid query parameters",
          errors: queryResult.error.flatten().fieldErrors,
        });
      }
      const { workspaceId } = queryResult.data;

      // Validate filename
      const filenameResult = filenameSchema.safeParse(file.filename);
      if (!filenameResult.success) {
        return reply.status(400).send({
          message: filenameResult.error.issues[0]?.message ?? "Invalid filename",
        });
      }

      // Validate extension
      const ext = extractExtension(file.filename);
      const extResult = extensionSchema.safeParse(ext);
      if (!extResult.success) {
        return reply.status(400).send({ message: "Unsupported file extension" });
      }

      // Validate MIME type
      const mimeResult = mimetypeSchema.safeParse(file.mimetype);
      if (!mimeResult.success) {
        return reply.status(400).send({ message: "Invalid or unsupported file type" });
      }

      // Read and validate file buffer
      const fileBuffer = await file.toBuffer();
      const sizeResult = fileSizeSchema.safeParse(fileBuffer.length);
      if (!sizeResult.success) {
        return reply.status(400).send({
          message: sizeResult.error.issues[0]?.message ?? "Invalid file size",
        });
      }

      // Validate magic bytes
      if (!validateMagicBytes(fileBuffer, file.mimetype)) {
        return reply.status(400).send({ message: "File content does not match its claimed type" });
      }

      // Auth
      const user = await getSessionUser(request);
      if (!user) return reply.status(401).send({ message: "Unauthorized" });

      // Workspace membership
      if (workspaceId) {
        const member = await workspaceService.getMember(workspaceId, user.id);
        if (!member) {
          return reply.status(403).send({ message: "Not a member of this workspace" });
        }
      }

      // Snapshot old image
      let oldImageUrl: string | null = null;
      if (workspaceId) {
        const ws = await workspaceService.getById(workspaceId);
        oldImageUrl = ws?.image ?? null;
      } else {
        oldImageUrl = user.image ?? null;
      }

      // Upload to R2
      const fileName = `${crypto.randomUUID()}.${extResult.data}`;
      const key = `images/${fileName}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: file.mimetype,
        }),
      );
      const imageUrl = `${R2_PUBLIC_URL}/${key}`;

      // Persist
      if (workspaceId) {
        await workspaceService.update(workspaceId, { image: imageUrl });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: imageUrl },
        });
      }

      // Cleanup old image
      if (oldImageUrl && oldImageUrl !== imageUrl) {
        const oldKey = keyFromUrl(oldImageUrl);
        if (oldKey) {
          r2Client
            .send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: oldKey }))
            .catch((err) => request.log.warn(err, "Failed to delete old image"));
        }
      }

      return reply.status(201).send({
        message: "Image uploaded successfully",
        key,
        url: imageUrl,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ message: "Failed to upload image" });
    }
  });
};
