import { UploadUsage } from "./api";

// Human-readable hints shown next to upload buttons — kept in sync with
// backend/src/config/uploadPresets.ts. The backend re-validates for real;
// this is just so the admin knows what to pick BEFORE uploading.
export const UPLOAD_HINTS: Record<UploadUsage, string> = {
  "home-grid": "Recommended 1600×1067px (3:2), JPG/PNG/WebP up to 5MB. Short MP4/WebM clips up to 20MB also allowed.",
  "brand-logo": "Recommended 800×400px transparent PNG (2:1), up to 2MB.",
  product: "Recommended 1000×1000px square (1:1), JPG/PNG/WebP up to 5MB.",
  "media-gallery": "Recommended 1920×1200px (16:10), JPG/PNG/WebP up to 8MB.",
  profile: "Recommended 600×600px square headshot, up to 3MB.",
  achievement: "Recommended 1200×840px, JPG/PNG/WebP up to 5MB.",
  "navbar-logo": "Recommended 300×300px square logo mark (1:1), transparent PNG/SVG/WebP, up to 1MB. It sits in a fixed round badge next to your company name, so a square mark works best on every screen size.",
  "site-general": "At least 300×300px, JPG/PNG/WebP up to 5MB.",
};
