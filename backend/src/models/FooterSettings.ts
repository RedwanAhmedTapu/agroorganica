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
  updatedAt: Date;
}

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
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default model<IFooterSettings>("FooterSettings", FooterSettingsSchema);
