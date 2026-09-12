import { Schema, model, Document } from "mongoose";

// Icon is stored as a lucide-react icon name (string) chosen by the admin
// from a fixed picklist on the frontend, e.g. "Facebook", "Instagram",
// "Youtube", "Linkedin", "Twitter", "MessageCircle" (WhatsApp), "Send" (Telegram).
export interface ISocialLink {
  id: string;
  platform: string; // display label, e.g. "Facebook"
  icon: string; // lucide-react icon name
  url: string;
  color?: string;
  active: boolean;
}

export interface IFooterSettings extends Document {
  socialLinks: ISocialLink[];
  certifications: string[];
  productBrochureUrl: string;
  updatedAt: Date;
}

// NOTE: The footer's "Quick Links" / "Investors" / "Media" columns are NOT
// stored here. They're generated on the frontend directly from the Company
// Profile tabs, Investor Relation items and Media galleries (the same data
// that drives the navbar dropdowns), so editing those pages automatically
// keeps the footer in sync — nothing to duplicate or maintain separately.
const SocialLinkSchema = new Schema<ISocialLink>(
  {
    id: { type: String, required: true },
    platform: { type: String, required: true },
    icon: { type: String, required: true },
    url: { type: String, required: true },
    color: { type: String },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const FooterSettingsSchema = new Schema<IFooterSettings>(
  {
    socialLinks: { type: [SocialLinkSchema], default: [] },
    certifications: { type: [String], default: [] },
    productBrochureUrl: { type: String, default: "" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default model<IFooterSettings>("FooterSettings", FooterSettingsSchema);