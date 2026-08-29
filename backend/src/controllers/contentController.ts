import { Request, Response } from "express";
import SiteContent from "../models/SiteContent";
import { defaultSiteContent } from "../utils/defaultContent";

// Ensures there is always exactly one content document, creating it from
// the seed defaults on first run (mirrors the old makeSeedData() behaviour).
async function getOrCreateContent() {
  let doc = await SiteContent.findOne();
  if (!doc) {
    doc = await SiteContent.create(defaultSiteContent());
  }
  return doc;
}

// GET /api/content — public, the whole site reads from this on every page load.
export async function getContent(req: Request, res: Response) {
  const doc = await getOrCreateContent();
  return res.status(200).json(doc);
}

// PUT /api/content — admin only. Accepts a full or partial AppData object
// (same shape the old DataContext kept in localStorage) and merges it in.
export async function updateContent(req: Request, res: Response) {
  const doc = await getOrCreateContent();
  const body = req.body || {};

  const allowedKeys = ["siteSettings", "home", "companyProfile", "brandsProducts", "investorRelation", "media", "messages"];
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      (doc as any)[key] = body[key];
    }
  }

  await doc.save();
  return res.status(200).json(doc);
}

// POST /api/content/messages — public (site contact form submits here directly)
export async function addMessage(req: Request, res: Response) {
  const { firstName, lastName, email, phone, message } = req.body || {};
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: "firstName, lastName, email and message are required." });
  }

  const doc = await getOrCreateContent();
  doc.messages.unshift({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    firstName,
    lastName,
    email,
    phone: phone || "",
    message,
    at: new Date().toISOString(),
  });
  await doc.save();
  return res.status(201).json({ success: true });
}

// DELETE /api/content/messages/:id — admin only
export async function deleteMessage(req: Request, res: Response) {
  const doc = await getOrCreateContent();
  doc.messages = doc.messages.filter((m: any) => m.id !== req.params.id);
  await doc.save();
  return res.status(200).json({ success: true });
}
