import { Request, Response } from "express";
import Asset from "../models/Asset";

// GET /api/assets?usage=product&limit=200 — admin only. Backs the "Image
// Library" admin page: one common place to upload images and grab their
// URLs (e.g. to paste into a bulk-import Excel sheet).
export async function listAssets(req: Request, res: Response) {
  const { usage } = req.query;
  const filter: any = {};
  if (usage && usage !== "all") filter.usage = usage;

  const assets = await Asset.find(filter).sort({ createdAt: -1 }).limit(300);
  return res.status(200).json({
    assets: assets.map((a) => ({
      id: a.id,
      url: a.url,
      usage: a.usage,
      originalName: a.originalName,
      mimetype: a.mimetype,
      width: a.width,
      height: a.height,
      size: a.size,
      createdAt: a.createdAt,
    })),
  });
}
