import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { IMAGE_PRESETS, PDF_LIMITS, UploadUsage } from "../config/uploadPresets";

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");

// Memory storage: we need the raw buffer in-hand so we can run it through
// sharp for real dimension/format validation BEFORE writing anything to
// disk. Nothing invalid ever touches the filesystem.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // hard ceiling; per-usage limit checked after
});

export const uploadImageMiddleware = memoryUpload.single("image");
export const uploadPdfMiddleware = memoryUpload.single("pdf");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Validates an in-memory image buffer against the preset for `usage`,
// returning a helpful error message array if invalid, or null if OK.
export async function validateImageBuffer(
  buffer: Buffer,
  mimetype: string,
  usage: UploadUsage
): Promise<{ ok: true; width: number; height: number } | { ok: false; errors: string[] }> {
  const preset = IMAGE_PRESETS[usage] || IMAGE_PRESETS["site-general"];
  const errors: string[] = [];

  if (!preset.allowedMime.includes(mimetype)) {
    errors.push(
      `Unsupported file type "${mimetype}". Allowed: ${preset.allowedMime.map((m) => m.split("/")[1]).join(", ")}.`
    );
  }

  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > preset.maxSizeMB) {
    errors.push(`File is ${sizeMB.toFixed(1)}MB, which exceeds the ${preset.maxSizeMB}MB limit for ${preset.label}.`);
  }

  // SVG has no raster dimensions sharp can reliably read in all cases; skip
  // pixel-dimension checks for it.
  if (mimetype === "image/svg+xml") {
    if (errors.length) return { ok: false, errors };
    return { ok: true, width: 0, height: 0 };
  }

  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < preset.minWidth || height < preset.minHeight) {
      errors.push(
        `Image is ${width}×${height}px, below the minimum ${preset.minWidth}×${preset.minHeight}px needed for ${preset.label} to stay sharp on all devices. Recommended: ${preset.recommended}`
      );
    }

    if (width && height) {
      const ratio = width / height;
      const min = preset.aspectRatio * (1 - preset.aspectTolerance);
      const max = preset.aspectRatio * (1 + preset.aspectTolerance);
      if (ratio < min || ratio > max) {
        errors.push(
          `Image aspect ratio ${ratio.toFixed(2)}:1 doesn't match the ${preset.aspectRatio.toFixed(
            2
          )}:1 shape expected for ${preset.label}. It may crop oddly on some screen sizes. Recommended: ${preset.recommended}`
        );
      }
    }

    if (errors.length) return { ok: false, errors };
    return { ok: true, width, height };
  } catch (err) {
    errors.push("Could not read image — the file may be corrupted.");
    return { ok: false, errors };
  }
}

export function validatePdfBuffer(buffer: Buffer, mimetype: string): string[] {
  const errors: string[] = [];
  if (!PDF_LIMITS.allowedMime.includes(mimetype)) {
    errors.push(`Unsupported file type "${mimetype}". Only PDF files are allowed.`);
  }
  const sizeMB = buffer.length / (1024 * 1024);
  if (sizeMB > PDF_LIMITS.maxSizeMB) {
    errors.push(`File is ${sizeMB.toFixed(1)}MB, which exceeds the ${PDF_LIMITS.maxSizeMB}MB limit.`);
  }
  return errors;
}

export function folderFor(usage: UploadUsage) {
  const preset = IMAGE_PRESETS[usage] || IMAGE_PRESETS["site-general"];
  const dir = path.join(UPLOAD_ROOT, preset.folder);
  ensureDir(dir);
  return dir;
}

export function investorPdfDir() {
  const dir = path.join(UPLOAD_ROOT, "investor");
  ensureDir(dir);
  return dir;
}

export { UPLOAD_ROOT };
