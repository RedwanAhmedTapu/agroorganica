import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getFooterSettings, updateFooterSettings } from "../controllers/footerController";

const router = Router();

router.get("/", getFooterSettings); // public — SiteFooter renders from here
router.put("/", requireAuth, updateFooterSettings); // admin only

export default router;
