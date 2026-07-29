import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { getSessionUser } from "@/lib/session.js";
import { prisma } from "@/lib/prisma.js";

// ── Constants ──

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif", "gif"] as const;

// ── Zod schemas ──

const querySchema = z.object({
  workspaceId: z
    .string()
    .min(20)
    .max(30)
    .regex(/^[a-zA-Z0-9]+$/, "Invalid workspace ID format")
    .optional(),
});

const filenameSchema = z
  .string()
  .min(1, "Filename is required")
  .max(255, "Filename too long")
  .refine((s) => !s.includes("/") && !s.includes("\\") && !s.includes(".."), {
    message: "Filename contains invalid characters",
  });

const extensionSchema = z
  .string()
  .toLowerCase()
  .refine((ext): ext is (typeof ALLOWED_EXTENSIONS)[number] =>
    (ALLOWED_EXTENSIONS as readonly string[]).includes(ext),
  { message: "Unsupported file extension" },
  );

const mimetypeSchema = z.enum(ALLOWED_MIMETYPES);

const fileSizeSchema = z.number().int().min(1, "Empty file").max(MAX_FILE_SIZE, "File too large. Max 5MB.");

// ── Magic bytes validator ──

function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  if (mimetype === "image/png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimetype === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/gif") {
    return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  }
  if (mimetype === "image/webp") {
    return buffer.length > 12
      && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
      && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  }
  if (mimetype === "image/avif") {
    return buffer.length > 12
      && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
      && buffer[8] === 0x61 && buffer[9] === 0x76 && buffer[10] === 0x69 && buffer[11] === 0x66;
  }
  return false;
}

// ── Helpers ──

function keyFromUrl(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

function extractExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1);
}

// ── Route ──

export const uploadRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/upload/image", async (request, reply) => {
    try {
      // ── Parse multipart file ──
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ message: "No file uploaded" });
      }

      // ── Validate query params ──
      const queryResult = querySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          message: "Invalid query parameters",
          errors: queryResult.error.flatten().fieldErrors,
        });
      }
      const { workspaceId } = queryResult.data;

      // ── Validate filename ──
      const filenameResult = filenameSchema.safeParse(file.filename);
      if (!filenameResult.success) {
        return reply.status(400).send({
          message: filenameResult.error.issues[0]?.message ?? "Invalid filename",
        });
      }

      // ── Validate extension ──
      const ext = extractExtension(file.filename);
      const extResult = extensionSchema.safeParse(ext);
      if (!extResult.success) {
        return reply.status(400).send({ message: "Unsupported file extension" });
      }

      // ── Validate MIME type ──
      const mimeResult = mimetypeSchema.safeParse(file.mimetype);
      if (!mimeResult.success) {
        return reply.status(400).send({ message: "Invalid or unsupported file type" });
      }

      // ── Read and validate file buffer ──
      const fileBuffer = await file.toBuffer();
      const sizeResult = fileSizeSchema.safeParse(fileBuffer.length);
      if (!sizeResult.success) {
        return reply.status(400).send({
          message: sizeResult.error.issues[0]?.message ?? "Invalid file size",
        });
      }

      // ── Validate magic bytes ──
      if (!validateMagicBytes(fileBuffer, file.mimetype)) {
        return reply.status(400).send({ message: "File content does not match its claimed type" });
      }

      // ── Auth ──
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      // ── Workspace membership ──
      if (workspaceId) {
        const member = await workspaceService.getMember(workspaceId, user.id);
        if (!member) {
          return reply.status(403).send({ message: "Not a member of this workspace" });
        }
      }

      // ── Snapshot old image ──
      let oldImageUrl: string | null = null;
      if (workspaceId) {
        const ws = await workspaceService.getById(workspaceId);
        oldImageUrl = ws?.image ?? null;
      } else {
        oldImageUrl = user.image ?? null;
      }

      // ── Upload to R2 ──
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

      // ── Persist ──
      if (workspaceId) {
        await workspaceService.update(workspaceId, { image: imageUrl });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: imageUrl },
        });
      }

      // ── Cleanup old image ──
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
