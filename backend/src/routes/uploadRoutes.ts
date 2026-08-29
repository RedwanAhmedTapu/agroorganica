import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { uploadImageMiddleware, uploadPdfMiddleware } from "../middleware/upload";
import { uploadImage, uploadPdf, deleteUpload, bulkDeleteUploads } from "../controllers/uploadController";

const router = Router();

// All upload/delete actions are admin-only — only the logged-in admin can
// add or remove media on the live site.
router.post("/image", requireAuth, uploadImageMiddleware, uploadImage);
router.post("/pdf", requireAuth, uploadPdfMiddleware, uploadPdf);
router.delete("/", requireAuth, deleteUpload);
router.post("/bulk-delete", requireAuth, bulkDeleteUploads);

export default router;
