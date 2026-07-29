import { R2_BUCKET_NAME, R2_PUBLIC_URL } from "@/utils/env.js";
import { r2Client } from "@/utils/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { FastifyInstance } from "fastify";

export const uploadRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/upload/image", async (request, reply) => {
    try {
      const file = request.file();
      if (!file) {
        return reply.status(400).send({ message: "No file uploaded" });
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
