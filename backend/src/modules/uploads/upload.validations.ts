import { z } from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIMETYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;

export const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif", "gif"] as const;

export const querySchema = z.object({
  workspaceId: z
    .string()
    .min(20)
    .max(30)
    .regex(/^[a-zA-Z0-9]+$/, "Invalid workspace ID format")
    .optional(),
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
    (ext): ext is (typeof ALLOWED_EXTENSIONS)[number] =>
      (ALLOWED_EXTENSIONS as readonly string[]).includes(ext),
    { message: "Unsupported file extension" },
  );

export const mimetypeSchema = z.enum(ALLOWED_MIMETYPES);

export const fileSizeSchema = z
  .number()
  .int()
  .min(1, "Empty file")
  .max(MAX_FILE_SIZE, "File too large. Max 5MB.");
