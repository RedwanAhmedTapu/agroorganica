import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  login,
  logout,
  me,
  forgotPasswordStart,
  forgotPasswordResend,
  forgotPasswordVerify,
  changePasswordStart,
  changePasswordResend,
  changePasswordVerify,
  loginHistory,
} from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

// Forgot password (not logged in) — OTP sent to the admin's registered phone.
router.post("/forgot-password", forgotPasswordStart);
router.post("/forgot-password/resend", forgotPasswordResend);
router.post("/forgot-password/verify", forgotPasswordVerify);

// Change password (logged in) — current password + OTP required.
router.post("/change-password/start", requireAuth, changePasswordStart);
router.post("/change-password/resend", requireAuth, changePasswordResend);
router.post("/change-password/verify", requireAuth, changePasswordVerify);

router.get("/login-history", requireAuth, loginHistory);

export default router;
