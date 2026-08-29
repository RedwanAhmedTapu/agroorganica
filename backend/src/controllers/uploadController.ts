import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { IMAGE_PRESETS, UploadUsage } from "../config/uploadPresets";
import { validateImageBuffer, validatePdfBuffer, folderFor, investorPdfDir, UPLOAD_ROOT } from "../middleware/upload";
import Asset from "../models/Asset";

function extFromMime(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
  };
  return map[mime] || "";
}

const HOME_GRID_MAX_VIDEO_MB = 20;

// POST /api/upload/image?usage=home-grid|brand-logo|product|media-gallery|profile|achievement
// The homepage grid also accepts short video clips (as the original app
// did) — those skip the image/aspect-ratio checks and just get a size cap.
export async function uploadImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No image file uploaded (field name must be 'image')." });

  const usage = (req.query.usage as UploadUsage) || "site-general";
  const preset = IMAGE_PRESETS[usage] || IMAGE_PRESETS["site-general"];

  if (usage === "home-grid" && file.mimetype.startsWith("video/")) {
    if (!["video/mp4", "video/webm"].includes(file.mimetype)) {
      return res.status(422).json({ error: "Video failed validation.", details: [`Unsupported video type "${file.mimetype}". Use MP4 or WebM.`] });
    }
    const sizeMB = file.buffer.length / (1024 * 1024);
    if (sizeMB > HOME_GRID_MAX_VIDEO_MB) {
      return res.status(422).json({
        error: "Video failed validation.",
        details: [`Video is ${sizeMB.toFixed(1)}MB, which exceeds the ${HOME_GRID_MAX_VIDEO_MB}MB limit. Keep homepage clips short and compressed.`],
      });
    }
    const filename = `${uuidv4()}${extFromMime(file.mimetype)}`;
    const dir = folderFor(usage);
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    const relPath = path.relative(UPLOAD_ROOT, path.join(dir, filename)).split(path.sep).join("/");
    const videoUrl = `/uploads/${relPath}`;
    const asset = await Asset.create({ url: videoUrl, usage, originalName: file.originalname, mimetype: file.mimetype, size: file.buffer.length });
    return res.status(201).json({ success: true, url: videoUrl, usage, kind: "video", assetId: asset.id });
  }

  const result = await validateImageBuffer(file.buffer, file.mimetype, usage);
  if (!result.ok) {
    return res.status(422).json({ error: "Image failed validation.", details: result.errors, preset: preset.recommended });
  }

  const filename = `${uuidv4()}${extFromMime(file.mimetype)}`;
  const dir = folderFor(usage);
  fs.writeFileSync(path.join(dir, filename), file.buffer);

  const relPath = path.relative(UPLOAD_ROOT, path.join(dir, filename)).split(path.sep).join("/");
  const url = `/uploads/${relPath}`;
  const width = (result as any).width;
  const height = (result as any).height;

  const asset = await Asset.create({
    url,
    usage,
    originalName: file.originalname,
    mimetype: file.mimetype,
    width,
    height,
    size: file.buffer.length,
  });

  return res.status(201).json({
    success: true,
    url,
    width,
    height,
    usage,
    kind: "image",
    assetId: asset.id,
  });
}

// POST /api/upload/pdf — for investor relation documents
export async function uploadPdf(req: Request, res: Response) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No PDF file uploaded (field name must be 'pdf')." });

  const errors = validatePdfBuffer(file.buffer, file.mimetype);
  if (errors.length) return res.status(422).json({ error: "PDF failed validation.", details: errors });

  const filename = `${uuidv4()}.pdf`;
  const dir = investorPdfDir();
  fs.writeFileSync(path.join(dir, filename), file.buffer);
  const url = `/uploads/investor/${filename}`;
  const asset = await Asset.create({ url, usage: "investor-pdf", originalName: file.originalname, mimetype: file.mimetype, size: file.buffer.length });

  return res.status(201).json({ success: true, url, originalName: file.originalname, assetId: asset.id });
}

// DELETE /api/upload?url=/uploads/home/xxx.jpg — admin only, removes one file from disk
export async function deleteUpload(req: Request, res: Response) {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "url query parameter is required." });
  await removeOne(url);
  return res.status(200).json({ success: true });
}

// POST /api/upload/bulk-delete { urls: string[] } — admin only, removes many files at once
// (used by admin UI "select multiple demo images -> delete" actions).
export async function bulkDeleteUploads(req: Request, res: Response) {
  const { urls } = req.body || {};
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "urls must be a non-empty array." });
  }
  const removed: string[] = [];
  const skipped: string[] = [];
  for (const url of urls) {
    if (await removeOne(url)) removed.push(url);
    else skipped.push(url);
  }
  return res.status(200).json({ success: true, removed, skipped });
}

// Only ever deletes files that live under our own /uploads root — never
// arbitrary paths — and silently no-ops for anything else (e.g. the
// data:image/svg+xml;... placeholder "demo" images seeded by default,
// which live inline in the database, not on disk, and are removed just by
// deleting them from the content array via PUT /api/content). Also removes
// the matching Asset library record, if any, so the Image Library stays in
// sync with what's actually on disk.
async function removeOne(url: string): Promise<boolean> {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return false;
  const relative = url.replace(/^\/uploads\//, "");
  const fullPath = path.join(UPLOAD_ROOT, relative);
  if (!fullPath.startsWith(UPLOAD_ROOT)) return false; // guards against ../ traversal
  await Asset.deleteOne({ url }).catch(() => {});
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}
