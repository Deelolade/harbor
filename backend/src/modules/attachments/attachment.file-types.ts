// ── File type definitions for upload validation ──

export type FileTypeGroup = "image" | "document" | "archive" | "code" | "misc";

export interface FileTypeInfo {
  group: FileTypeGroup;
  mimeTypes: readonly string[];
  extensions: readonly string[];
  maxSize: number; // bytes
  validateMagic: (buffer: Buffer) => boolean;
}

// ── Magic byte validators ──

function bufEq(buffer: Buffer, offset: number, bytes: number[]): boolean {
  if (buffer.length < offset + bytes.length) return false;
  return bytes.every((b, i) => buffer[offset + i] === b);
}

// ── File type definitions ──

export const FILE_TYPES = {
  /** Images */
  image_png: {
    group: "image",
    mimeTypes: ["image/png"],
    extensions: ["png"],
    maxSize: 10 * 1024 * 1024, // 10MB
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x89, 0x50, 0x4e, 0x47]),
  },
  image_jpeg: {
    group: "image",
    mimeTypes: ["image/jpeg"],
    extensions: ["jpg", "jpeg"],
    maxSize: 10 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0xff, 0xd8, 0xff]),
  },
  image_webp: {
    group: "image",
    mimeTypes: ["image/webp"],
    extensions: ["webp"],
    maxSize: 10 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x52, 0x49, 0x46, 0x46]) && bufEq(b, 8, [0x57, 0x45, 0x42, 0x50]),
  },
  image_gif: {
    group: "image",
    mimeTypes: ["image/gif"],
    extensions: ["gif"],
    maxSize: 10 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x47, 0x49, 0x46, 0x38]),
  },
  image_avif: {
    group: "image",
    mimeTypes: ["image/avif"],
    extensions: ["avif"],
    maxSize: 10 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 4, [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]),
  },
  image_svg: {
    group: "image",
    mimeTypes: ["image/svg+xml"],
    extensions: ["svg"],
    maxSize: 2 * 1024 * 1024, // 2MB for SVG (text-based)
    // SVG is text, not binary; skip magic byte check
    validateMagic: () => true,
  },

  /** Documents */
  document_pdf: {
    group: "document",
    mimeTypes: ["application/pdf"],
    extensions: ["pdf"],
    maxSize: 25 * 1024 * 1024, // 25MB
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x25, 0x50, 0x44, 0x46]),
  },
  document_doc: {
    group: "document",
    mimeTypes: ["application/msword"],
    extensions: ["doc"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  document_docx: {
    group: "document",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    extensions: ["docx"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x50, 0x4b, 0x03, 0x04]),
  },
  document_xls: {
    group: "document",
    mimeTypes: ["application/vnd.ms-excel"],
    extensions: ["xls"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  document_xlsx: {
    group: "document",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    extensions: ["xlsx"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x50, 0x4b, 0x03, 0x04]),
  },
  document_ppt: {
    group: "document",
    mimeTypes: ["application/vnd.ms-powerpoint"],
    extensions: ["ppt"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  document_pptx: {
    group: "document",
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    extensions: ["pptx"],
    maxSize: 25 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x50, 0x4b, 0x03, 0x04]),
  },
  document_txt: {
    group: "document",
    mimeTypes: ["text/plain"],
    extensions: ["txt"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true, // text files have no magic bytes
  },
  document_csv: {
    group: "document",
    mimeTypes: ["text/csv"],
    extensions: ["csv"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  document_md: {
    group: "document",
    mimeTypes: ["text/markdown"],
    extensions: ["md"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },

  /** Archives */
  archive_zip: {
    group: "archive",
    mimeTypes: ["application/zip", "application/x-zip-compressed"],
    extensions: ["zip"],
    maxSize: 50 * 1024 * 1024, // 50MB
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x50, 0x4b, 0x03, 0x04]),
  },
  archive_gz: {
    group: "archive",
    mimeTypes: ["application/gzip", "application/x-gzip"],
    extensions: ["gz", "gzip"],
    maxSize: 50 * 1024 * 1024,
    validateMagic: (b: Buffer) => bufEq(b, 0, [0x1f, 0x8b]),
  },
  archive_tar: {
    group: "archive",
    mimeTypes: ["application/x-tar"],
    extensions: ["tar"],
    maxSize: 50 * 1024 * 1024,
    // tar has magic at offset 257 (ustar\0), skip strict check
    validateMagic: () => true,
  },

  /** Code files */
  code_js: {
    group: "code",
    mimeTypes: [
      "application/javascript",
      "text/javascript",
      "application/x-javascript",
    ],
    extensions: ["js", "mjs"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  code_ts: {
    group: "code",
    mimeTypes: ["application/typescript", "text/typescript"],
    extensions: ["ts"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  code_json: {
    group: "code",
    mimeTypes: ["application/json"],
    extensions: ["json"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  code_html: {
    group: "code",
    mimeTypes: ["text/html"],
    extensions: ["html", "htm"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  code_css: {
    group: "code",
    mimeTypes: ["text/css"],
    extensions: ["css"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
  code_xml: {
    group: "code",
    mimeTypes: ["application/xml", "text/xml"],
    extensions: ["xml"],
    maxSize: 5 * 1024 * 1024,
    validateMagic: () => true,
  },
} as const satisfies Record<string, FileTypeInfo>;

export type FileTypeKey = keyof typeof FILE_TYPES;

// ── Derived lookup maps ──

/** Lookup file type key by MIME type */
const mimeLookup = new Map<string, FileTypeKey>();
for (const [key, info] of Object.entries(FILE_TYPES)) {
  for (const mime of info.mimeTypes) {
    mimeLookup.set(mime, key as FileTypeKey);
  }
}

/** Lookup file type key by extension */
const extLookup = new Map<string, FileTypeKey>();
for (const [key, info] of Object.entries(FILE_TYPES)) {
  for (const ext of info.extensions) {
    extLookup.set(ext.toLowerCase(), key as FileTypeKey);
  }
}

export function getTypeByMime(mime: string): FileTypeKey | undefined {
  return mimeLookup.get(mime);
}

export function getTypeByExt(ext: string): FileTypeKey | undefined {
  return extLookup.get(ext.toLowerCase());
}

/** All allowed MIME types across every group */
export const ALLOWED_MIMETYPES = [...mimeLookup.keys()];

/** All allowed extensions across every group */
export const ALLOWED_EXTENSIONS = [...extLookup.keys()];
