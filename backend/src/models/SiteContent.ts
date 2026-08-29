import { Schema, model, Document } from "mongoose";

// This mirrors lib/types.ts (AppData) on the frontend almost field-for-field.
// We keep it as a single "singleton" document (one row) so the API shape and
// update pattern (GET whole object / PUT whole object) matches exactly what
// the previous localStorage-based DataContext was doing — this made porting
// the admin UI a straight fetch()/PUT swap instead of a rewrite.
//
// Content is intentionally typed loosely with Schema.Types.Mixed for nested
// arrays of varying shapes (tabs can be text/profile/achievement) — full
// validation of each shape happens in the controller layer instead.

export interface ISiteContent extends Document {
  siteSettings: {
    logoUrl: string;
    companyName: string;
    companySubtitle: string;
    footerDescription: string;
    ourBrandText: string;
    contactAddress: string;
    contactPhone: string;
    contactEmail: string;
  };
  home: {
    grid: {
      templateId: string;
      items: any[];
    };
    brands: any[];
  };
  companyProfile: { tabs: any[] };
  brandsProducts: { categories: any[] };
  investorRelation: { items: any[] };
  media: { sections: any[] };
  messages: any[];
  updatedAt: Date;
}

const mixedArray = { type: [Schema.Types.Mixed], default: [] } as any;

const SiteContentSchema = new Schema<ISiteContent>(
  {
    siteSettings: {
      logoUrl: { type: String, default: "" },
      companyName: { type: String, default: "Agro Organica" },
      companySubtitle: { type: String, default: "Nurture Nature" },
      footerDescription: { type: String, default: "" },
      ourBrandText: { type: String, default: "" },
      contactAddress: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
    },
    home: {
      grid: {
        templateId: { type: String, default: "classic-5" },
        items: mixedArray,
      },
      brands: mixedArray,
    },
    companyProfile: {
      tabs: mixedArray,
    },
    brandsProducts: {
      categories: mixedArray,
    },
    investorRelation: {
      items: mixedArray,
    },
    media: {
      sections: mixedArray,
    },
    messages: mixedArray,
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default model<ISiteContent>("SiteContent", SiteContentSchema);
