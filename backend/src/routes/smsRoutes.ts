import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getBalance } from "../utils/sms";

const router = Router();

// GET /api/sms/balance — lets the logged-in admin check remaining SMS credit
// with the gateway (used to warn before OTP sending starts failing).
router.get("/balance", requireAuth, async (req: Request, res: Response) => {
  try {
    const balance = await getBalance();
    res.status(200).json({ success: true, balance });
  } catch (error: any) {
    console.error("Error fetching SMS balance:", error.message);
    res.status(500).json({ error: "Failed to fetch balance", details: error.message });
  }
});

export default router;
