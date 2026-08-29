import { Request, Response } from "express";
import FooterSettings from "../models/FooterSettings";

const ALLOWED_ICONS = [
  "Facebook",
  "Instagram",
  "Twitter",
  "Youtube",
  "Linkedin",
  "MessageCircle", // WhatsApp
  "Send", // Telegram
  "Music2", // TikTok
  "Github",
  "Globe",
  "Mail",
  "Phone",
];

async function getOrCreate() {
  let doc = await FooterSettings.findOne();
  if (!doc) doc = await FooterSettings.create({ socialLinks: [] });
  return doc;
}

// GET /api/footer — public, rendered by SiteFooter on every page.
export async function getFooterSettings(req: Request, res: Response) {
  const doc = await getOrCreate();
  return res.status(200).json({ socialLinks: doc.socialLinks, allowedIcons: ALLOWED_ICONS });
}

// PUT /api/footer — admin only, replaces the full social link list.
export async function updateFooterSettings(req: Request, res: Response) {
  const { socialLinks } = req.body || {};
  if (!Array.isArray(socialLinks)) {
    return res.status(400).json({ error: "socialLinks must be an array." });
  }

  for (const link of socialLinks) {
    if (!link.platform || !link.icon || !link.url) {
      return res.status(400).json({ error: "Each social link needs platform, icon and url." });
    }
    if (!ALLOWED_ICONS.includes(link.icon)) {
      return res.status(400).json({ error: `Icon "${link.icon}" is not in the allowed icon list.` });
    }
    try {
      new URL(link.url);
    } catch {
      return res.status(400).json({ error: `"${link.url}" is not a valid URL. Include https://` });
    }
  }

  const doc = await getOrCreate();
  doc.socialLinks = socialLinks.map((l: any, i: number) => ({
    id: l.id || `social-${Date.now()}-${i}`,
    platform: l.platform,
    icon: l.icon,
    url: l.url,
    color: l.color || "",
    active: l.active !== false,
  }));
  await doc.save();

  return res.status(200).json({ socialLinks: doc.socialLinks });
}
