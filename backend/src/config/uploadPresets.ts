// Central place that defines the recommended / minimum image dimensions and
// size limits for every image slot in the site. The frontend upload widgets
// show these same numbers to the admin BEFORE upload, and the backend
// re-validates them here so nothing bad ever reaches the database or disk.
//
// Rule of thumb used everywhere: we ask for the image at roughly the size it
// will render at 2x pixel density on desktop, with a fixed aspect ratio so
// object-fit:cover always crops predictably on phones/tablets/desktop.

export type UploadUsage =
  | "home-grid" // homepage media grid tiles (image or video poster)
  | "brand-logo" // brand slider logos
  | "product" // product card image
  | "media-gallery" // media/press gallery images
  | "profile" // company profile people photos
  | "achievement" // company profile achievement photos
  | "navbar-logo" // site header / navbar logo
  | "site-general"; // fallback / anything else

export type ImagePreset = {
  label: string;
  folder: string;
  maxSizeMB: number;
  minWidth: number;
  minHeight: number;
  aspectRatio: number; // width / height
  aspectTolerance: number; // +/- allowed fractional deviation from aspectRatio
  recommended: string; // human readable hint shown in the UI
  allowedMime: string[];
};

export const IMAGE_PRESETS: Record<UploadUsage, ImagePreset> = {
  "home-grid": {
    label: "Homepage grid image",
    folder: "home",
    maxSizeMB: 5,
    minWidth: 1200,
    minHeight: 800,
    aspectRatio: 3 / 2,
    aspectTolerance: 0.25,
    recommended: "1600×1067px (3:2 landscape), JPG/PNG/WebP, up to 5MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  "brand-logo": {
    label: "Brand logo",
    folder: "brands",
    maxSizeMB: 2,
    minWidth: 400,
    minHeight: 200,
    aspectRatio: 2 / 1,
    aspectTolerance: 0.5,
    recommended: "800×400px transparent PNG (2:1), up to 2MB",
    allowedMime: ["image/png", "image/webp", "image/jpeg", "image/svg+xml"],
  },
  product: {
    label: "Product image",
    folder: "products",
    maxSizeMB: 5,
    minWidth: 800,
    minHeight: 800,
    aspectRatio: 1,
    aspectTolerance: 0.15,
    recommended: "1000×1000px square (1:1), JPG/PNG/WebP, up to 5MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  "media-gallery": {
    label: "Media gallery image",
    folder: "media",
    maxSizeMB: 8,
    minWidth: 1600,
    minHeight: 1000,
    aspectRatio: 16 / 10,
    aspectTolerance: 0.3,
    recommended: "1920×1200px (16:10), JPG/PNG/WebP, up to 8MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  profile: {
    label: "Profile photo",
    folder: "media/profile",
    maxSizeMB: 3,
    minWidth: 500,
    minHeight: 500,
    aspectRatio: 1,
    aspectTolerance: 0.1,
    recommended: "600×600px square headshot, up to 3MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  achievement: {
    label: "Achievement image",
    folder: "media/achievement",
    maxSizeMB: 5,
    minWidth: 1000,
    minHeight: 700,
    aspectRatio: 10 / 7,
    aspectTolerance: 0.3,
    recommended: "1200×840px, JPG/PNG/WebP, up to 5MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp"],
  },
  "site-general": {
    label: "Image",
    folder: "general",
    maxSizeMB: 5,
    minWidth: 300,
    minHeight: 300,
    aspectRatio: 1,
    aspectTolerance: 5, // effectively no aspect check
    recommended: "At least 300×300px, JPG/PNG/WebP, up to 5MB",
    allowedMime: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
  "navbar-logo": {
    label: "Navbar logo",
    folder: "brand",
    maxSizeMB: 1,
    minWidth: 120,
    minHeight: 120,
    aspectRatio: 1, // sits inside a fixed circular badge next to the (separately editable) company name/subtitle text
    aspectTolerance: 0.3,
    recommended: "300×300px square logo mark, transparent PNG/SVG/WebP, up to 1MB",
    allowedMime: ["image/png", "image/webp", "image/svg+xml", "image/jpeg"],
  },
};

export const PDF_LIMITS = {
  maxSizeMB: 15,
  allowedMime: ["application/pdf"],
};
