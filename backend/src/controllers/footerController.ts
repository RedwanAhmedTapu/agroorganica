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

function defaultCertifications() {
  return ["BSTI", "ISO-22000", "HACCP", "HALAL"];
}

async function getOrCreate() {
  let doc = await FooterSettings.findOne();
  if (!doc) {
    doc = await FooterSettings.create({
      socialLinks: [],
      certifications: defaultCertifications(),
      productBrochureUrl: "",
    });
  }
  return doc;
}

// GET /api/footer — public, rendered by SiteFooter on every page. The
// Quick Links / Investors / Media columns are NOT part of this response —
// SiteFooter builds those itself from Company Profile / Investor Relation
// / Media content via the regular /api/content endpoint.
export async function getFooterSettings(req: Request, res: Response) {
  const doc = await getOrCreate();
  return res.status(200).json({
    socialLinks: doc.socialLinks,
    certifications: doc.certifications,
    productBrochureUrl: doc.productBrochureUrl,
    allowedIcons: ALLOWED_ICONS,
  });
}

// PUT /api/footer — admin only.
export async function updateFooterSettings(req: Request, res: Response) {
  const { socialLinks, certifications, productBrochureUrl } = req.body || {};

  if (socialLinks !== undefined && !Array.isArray(socialLinks)) {
    return res.status(400).json({ error: "socialLinks must be an array." });
  }
  if (certifications !== undefined && !Array.isArray(certifications)) {
    return res.status(400).json({ error: "certifications must be an array." });
  }

  if (socialLinks) {
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
  }

  if (productBrochureUrl && typeof productBrochureUrl === "string" && productBrochureUrl.trim()) {
    const isRelativeUpload = productBrochureUrl.startsWith("/uploads/");
    if (!isRelativeUpload) {
      try {
        new URL(productBrochureUrl);
      } catch {
        return res.status(400).json({ error: `"${productBrochureUrl}" is not a valid URL. Include https://` });
      }
    }
  }

  const doc = await getOrCreate();

  if (socialLinks) {
    doc.socialLinks = socialLinks.map((l: any, i: number) => ({
      id: l.id || `social-${Date.now()}-${i}`,
      platform: l.platform,
      icon: l.icon,
      url: l.url,
      color: l.color || "",
      active: l.active !== false,
    }));
  }

  if (certifications) {
    doc.certifications = certifications.map((c: any) => String(c).trim()).filter(Boolean);
  }

  if (productBrochureUrl !== undefined) {
    doc.productBrochureUrl = productBrochureUrl.trim();
  }

  await doc.save();

  return res.status(200).json({
    socialLinks: doc.socialLinks,
    certifications: doc.certifications,
    productBrochureUrl: doc.productBrochureUrl,
    allowedIcons: ALLOWED_ICONS,
  });
}