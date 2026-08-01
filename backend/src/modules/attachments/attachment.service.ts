import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma.js";
import { FILE_TYPES } from "./attachment.file-types.js";
import { keyFromUrl, validateMagicBytes } from "./attachment.helpers.js";

export interface UploadInput {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

export const attachmentService = {
  /** Upload a file to R2 and create the attachment DB record */
  async upload(taskId: string, input: UploadInput, fileTypeKey: string) {
    const fileTypeInfo = FILE_TYPES[fileTypeKey as keyof typeof FILE_TYPES];

    // Per-type size validation
    if (input.buffer.length > fileTypeInfo.maxSize) {
      const maxMB = fileTypeInfo.maxSize / 1024 / 1024;
      throw Object.assign(new Error(`File too large. Max ${maxMB}MB for ${fileTypeInfo.group} files.`), { statusCode: 400 });
    }

    // Validate magic bytes
    if (!validateMagicBytes(input.buffer, input.mimetype)) {
      throw Object.assign(new Error("File content does not match its claimed type"), { statusCode: 400 });
    }

    // Upload to R2 under attachments/ prefix
    const ext = input.filename.slice(input.filename.lastIndexOf(".") + 1);
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const key = `attachments/${fileName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimetype,
      }),
    );
    const url = `${R2_PUBLIC_URL}/${key}`;

    // Create attachment record in DB
    const attachment = await prisma.attachment.create({
      data: {
        name: input.filename,
        url,
        taskId,
      },
    });

    return attachment;
  },

  /** Rename an attachment */
  async rename(id: string, name: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return null;

    return prisma.attachment.update({
      where: { id },
      data: { name },
    });
  },

  /** Delete an attachment by ID — removes from DB and R2 */
  async delete(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return null;

    // Remove from DB
    await prisma.attachment.delete({ where: { id } });

    // Remove from R2 (fire-and-forget)
    const oldKey = keyFromUrl(attachment.url);
    if (oldKey) {
      r2Client
        .send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: oldKey }))
        .catch(() => {
          // Logged by caller if needed
        });
    }

    return attachment;
  },
};
