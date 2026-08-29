import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listAssets } from "../controllers/assetsController";

const router = Router();

// Deleting assets reuses POST /api/upload/bulk-delete (by URL), which also
// removes the matching Asset record — no separate delete route needed here.
router.get("/", requireAuth, listAssets);

export default router;
