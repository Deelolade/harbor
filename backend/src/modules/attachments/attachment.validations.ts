import { z } from "zod";
import { ALLOWED_MIMETYPES, ALLOWED_EXTENSIONS } from "./attachment.file-types.js";

export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB fallback

export const querySchema = z.object({
  taskId: z
    .string()
    .min(20, "Invalid task ID")
    .max(30, "Invalid task ID")
    .regex(/^[a-zA-Z0-9]+$/, "Invalid task ID format"),
});

export const filenameSchema = z
  .string()
  .min(1, "Filename is required")
  .max(255, "Filename too long")
  .refine((s) => !s.includes("/") && !s.includes("\\") && !s.includes(".."), {
    message: "Filename contains invalid characters",
  });

export const extensionSchema = z
  .string()
  .toLowerCase()
  .refine(
    (ext): ext is string =>
      (ALLOWED_EXTENSIONS as readonly string[]).includes(ext),
    { message: "Unsupported file extension" },
  );

export const mimetypeSchema = z
  .string()
  .refine(
    (mime): mime is string =>
      (ALLOWED_MIMETYPES as readonly string[]).includes(mime),
    { message: "Invalid or unsupported file type" },
  );

export const fileSizeSchema = z
  .number()
  .int()
  .min(1, "Empty file")
  .max(DEFAULT_MAX_FILE_SIZE, `File too large. Max ${DEFAULT_MAX_FILE_SIZE / 1024 / 1024}MB.`);
