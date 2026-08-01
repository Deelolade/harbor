import { getTypeByMime, getTypeByExt, FILE_TYPES } from "./attachment.file-types.js";

/** Extract the R2 key from a full public URL */
export function keyFromUrl(url: string): string | null {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

/** Extract file extension from a filename */
export function extractExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1);
}

/** Check file magic bytes to verify the content matches the claimed type */
export function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const typeKey = getTypeByMime(mimetype);
  if (!typeKey) return false;

  return FILE_TYPES[typeKey].validateMagic(buffer);
}

/**
 * Validate that both MIME type and extension agree on the same file type key.
 * Returns the resolved file type key if consistent, or null.
 */
export function resolveFileType(
  mimetype: string,
  ext: string,
): string | null {
  const mimeKey = getTypeByMime(mimetype);
  const extKey = getTypeByExt(ext);

  if (!mimeKey || !extKey) return null;
  if (mimeKey !== extKey) return null;

  return mimeKey;
}
