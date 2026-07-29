import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FastifyInstance } from "fastify";
import crypto from "node:crypto";
import { workspaceService } from "@/modules/workspace/workspace.service.js";
import { getSessionUser } from "@/lib/session.js";
import { prisma } from "@/lib/prisma.js";

/** Extract the R2 key from a full public URL (e.g. "https://...r2.dev/images/abc.png" → "images/abc.png") */
function keyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

export const uploadRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/upload/image", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({ message: "No file uploaded" });
      }

      // Auth is always required
      const user = await getSessionUser(request);
      if (!user) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      // workspaceId is optional — if provided, verify membership
      const { workspaceId } = request.query as { workspaceId?: string };
      if (workspaceId) {
        const member = await workspaceService.getMember(workspaceId, user.id);
        if (!member) {
          return reply
            .status(403)
            .send({ message: "Not a member of this workspace" });
        }
      }

      // types of images allowed
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/avif",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return reply.status(400).send({ message: "Invalid file type" });
      }

      // Snapshot the old image URL before we overwrite it
      let oldImageUrl: string | null = null;
      if (workspaceId) {
        const ws = await workspaceService.getById(workspaceId);
        oldImageUrl = ws?.image ?? null;
      } else {
        oldImageUrl = user.image ?? null;
      }

      // Upload the new file
      const fileBuffer = await file.toBuffer();
      const extension = file.filename.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${extension}`;

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

      // Store in the right place
      if (workspaceId) {
        await workspaceService.update(workspaceId, { image: imageUrl });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { image: imageUrl },
        });
      }

      // Delete the old image from R2 (don't block the response)
      if (oldImageUrl && oldImageUrl !== imageUrl) {
        const oldKey = keyFromUrl(oldImageUrl);
        if (oldKey) {
          r2Client
            .send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: oldKey,
              }),
            )
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
