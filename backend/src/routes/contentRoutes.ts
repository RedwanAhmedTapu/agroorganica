import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getContent, updateContent, addMessage, deleteMessage } from "../controllers/contentController";

const router = Router();

router.get("/", getContent); // public — the whole site reads from here
router.put("/", requireAuth, updateContent); // admin only

router.post("/messages", addMessage); // public — contact form
router.delete("/messages/:id", requireAuth, deleteMessage); // admin only

export default router;
