import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma.js";
import { FILE_TYPES } from "./attachment.file-types.js";
import { keyFromUrl, validateMagicBytes, extractExtension } from "./attachment.helpers.js";
import { ALLOWED_EXTENSIONS } from "./attachment.file-types.js";

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

  /** Rename an attachment — copies R2 object to a new key, deletes old, updates DB */
  async rename(id: string, newName: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) return null;

    const oldKey = keyFromUrl(attachment.url);
    const oldExt = extractExtension(attachment.name);

    // Determine the new extension:
    // Use the extension from newName if provided and valid,
    // otherwise fall back to the original extension.
    let newExt = extractExtension(newName).toLowerCase();
    if (!newExt || !(ALLOWED_EXTENSIONS as readonly string[]).includes(newExt)) {
      newExt = oldExt;
      // Append original extension to the name if user didn't provide one
      if (!extractExtension(newName)) {
        newName = `${newName}.${newExt}`;
      }
    }

    // If there's no R2 key (shouldn't happen, but handle gracefully),
    // just update the DB name.
    if (!oldKey) {
      return prisma.attachment.update({
        where: { id },
        data: { name: newName },
      });
    }

    // Only touch R2 if the key actually changes
    const newKey = `attachments/${crypto.randomUUID()}.${newExt}`;

    // Copy object to new key within R2
    await r2Client.send(
      new CopyObjectCommand({
        Bucket: R2_BUCKET_NAME,
        CopySource: `${R2_BUCKET_NAME}/${oldKey}`,
        Key: newKey,
      }),
    );

    // Delete old object (fire-and-forget)
    r2Client
      .send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: oldKey }))
      .catch(() => {});

    const newUrl = `${R2_PUBLIC_URL}/${newKey}`;

    // Update DB with new name and new URL
    return prisma.attachment.update({
      where: { id },
      data: { name: newName, url: newUrl },
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
