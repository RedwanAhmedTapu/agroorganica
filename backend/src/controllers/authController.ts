import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin";
import LoginLog from "../models/LoginLog";
import OtpToken from "../models/OtpToken";
import { signToken, setAuthCookie, clearAuthCookie, AuthedRequest } from "../middleware/auth";
import { getClientIp, parseDevice } from "../utils/deviceInfo";
import { generateOtp, sendOtpSms } from "../utils/sms";

const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 5);
const RESEND_COOLDOWN_SECONDS = 30;

async function logAttempt(adminId: string, success: boolean, req: Request, reason?: string) {
  const ua = req.headers["user-agent"] || "";
  const { browser, os, deviceModel, deviceType } = parseDevice(ua);
  await LoginLog.create({
    admin: adminId,
    success,
    reason,
    ip: getClientIp(req),
    userAgentRaw: ua,
    browser,
    os,
    deviceModel,
    deviceType,
  });
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  if (!admin) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    await logAttempt(admin.id, false, req, "wrong_password");
    return res.status(401).json({ error: "Invalid username or password." });
  }

  await logAttempt(admin.id, true, req);

  const token = signToken(admin.id);
  setAuthCookie(res, token);

  return res.status(200).json({
    success: true,
    token, // also returned for non-cookie clients; browser should rely on the httpOnly cookie
    admin: { id: admin.id, username: admin.username, name: admin.name, phone: maskPhone(admin.phone) },
  });
}

// POST /api/auth/logout
export async function logout(req: Request, res: Response) {
  clearAuthCookie(res);
  return res.status(200).json({ success: true });
}

// GET /api/auth/me
export async function me(req: AuthedRequest, res: Response) {
  const admin = await Admin.findById(req.adminId).select("-passwordHash");
  if (!admin) return res.status(404).json({ error: "Admin not found" });
  return res.status(200).json({
    id: admin.id,
    username: admin.username,
    name: admin.name,
    phone: maskPhone(admin.phone),
  });
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `${digits.slice(0, 3)}${"*".repeat(Math.max(0, digits.length - 6))}${digits.slice(-3)}`;
}

async function issueOtp(adminId: string, phone: string, purpose: "reset-password" | "change-password") {
  const otp = generateOtp(Number(process.env.OTP_LENGTH || 6));
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await OtpToken.create({ admin: adminId, codeHash, purpose, expiresAt, lastSentAt: new Date() });
  const smsResult = await sendOtpSms(phone, otp, purpose);
  return smsResult;
}

// POST /api/auth/forgot-password  { username }
// Starts the reset flow: finds the admin, sends an OTP to their registered phone.
export async function forgotPasswordStart(req: Request, res: Response) {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "Username is required." });

  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  // Don't reveal whether the username exists — respond the same way either way.
  if (!admin) {
    return res.status(200).json({
      success: true,
      message: "If that account exists, an OTP has been sent to its registered phone number.",
    });
  }

  const result = await issueOtp(admin.id, admin.phone, "reset-password");
  if (!result.success) {
    return res.status(502).json({ error: `Failed to send OTP SMS: ${result.meaning}` });
  }

  return res.status(200).json({
    success: true,
    message: `OTP sent to ${maskPhone(admin.phone)}. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
    adminRef: admin.id, // used by frontend to call resend/verify without re-typing username
  });
}

// POST /api/auth/forgot-password/resend { username }
export async function forgotPasswordResend(req: Request, res: Response) {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "Username is required." });

  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  if (!admin) {
    return res.status(200).json({ success: true, message: "If that account exists, a new OTP has been sent." });
  }

  const last = await OtpToken.findOne({ admin: admin.id, purpose: "reset-password" }).sort({ createdAt: -1 });
  if (last && Date.now() - last.lastSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - last.lastSentAt.getTime())) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSec}s before requesting another OTP.` });
  }

  const result = await issueOtp(admin.id, admin.phone, "reset-password");
  if (!result.success) {
    return res.status(502).json({ error: `Failed to resend OTP SMS: ${result.meaning}` });
  }

  return res.status(200).json({ success: true, message: `A new OTP was sent to ${maskPhone(admin.phone)}.` });
}

// POST /api/auth/forgot-password/verify { username, otp, newPassword }
export async function forgotPasswordVerify(req: Request, res: Response) {
  const { username, otp, newPassword } = req.body || {};
  if (!username || !otp || !newPassword) {
    return res.status(400).json({ error: "Username, OTP and newPassword are required." });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  if (!admin) return res.status(400).json({ error: "Invalid or expired OTP." });

  const token = await OtpToken.findOne({
    admin: admin.id,
    purpose: "reset-password",
    used: false,
  }).sort({ createdAt: -1 });

  const invalid = await checkOtp(token, otp);
  if (invalid) return res.status(400).json({ error: invalid });

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();
  token!.used = true;
  await token!.save();

  return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
}

// POST /api/auth/change-password/start (auth required) { currentPassword }
// Verifies the current password, then sends an OTP to the admin's phone
// before allowing the actual change.
export async function changePasswordStart(req: AuthedRequest, res: Response) {
  const { currentPassword } = req.body || {};
  if (!currentPassword) return res.status(400).json({ error: "Current password is required." });

  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ error: "Admin not found." });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect." });

  const result = await issueOtp(admin.id, admin.phone, "change-password");
  if (!result.success) {
    return res.status(502).json({ error: `Failed to send OTP SMS: ${result.meaning}` });
  }

  return res.status(200).json({
    success: true,
    message: `OTP sent to ${maskPhone(admin.phone)}. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
  });
}

// POST /api/auth/change-password/resend (auth required)
export async function changePasswordResend(req: AuthedRequest, res: Response) {
  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ error: "Admin not found." });

  const last = await OtpToken.findOne({ admin: admin.id, purpose: "change-password" }).sort({ createdAt: -1 });
  if (last && Date.now() - last.lastSentAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - last.lastSentAt.getTime())) / 1000);
    return res.status(429).json({ error: `Please wait ${waitSec}s before requesting another OTP.` });
  }

  const result = await issueOtp(admin.id, admin.phone, "change-password");
  if (!result.success) return res.status(502).json({ error: `Failed to resend OTP SMS: ${result.meaning}` });

  return res.status(200).json({ success: true, message: `A new OTP was sent to ${maskPhone(admin.phone)}.` });
}

// POST /api/auth/change-password/verify (auth required) { otp, newPassword }
export async function changePasswordVerify(req: AuthedRequest, res: Response) {
  const { otp, newPassword } = req.body || {};
  if (!otp || !newPassword) return res.status(400).json({ error: "OTP and newPassword are required." });
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  const admin = await Admin.findById(req.adminId);
  if (!admin) return res.status(404).json({ error: "Admin not found." });

  const token = await OtpToken.findOne({
    admin: admin.id,
    purpose: "change-password",
    used: false,
  }).sort({ createdAt: -1 });

  const invalid = await checkOtp(token, otp);
  if (invalid) return res.status(400).json({ error: invalid });

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  await admin.save();
  token!.used = true;
  await token!.save();

  return res.status(200).json({ success: true, message: "Password changed successfully." });
}

// Shared OTP check: expiry, used flag, attempt limiting, and the actual compare.
async function checkOtp(token: any, otp: string): Promise<string | null> {
  if (!token) return "No OTP request found. Please request a new OTP.";
  if (token.used) return "This OTP has already been used. Please request a new one.";
  if (token.expiresAt.getTime() < Date.now()) return "This OTP has expired. Please request a new one.";
  if (token.attempts >= 5) return "Too many incorrect attempts. Please request a new OTP.";

  const match = await bcrypt.compare(String(otp), token.codeHash);
  if (!match) {
    token.attempts += 1;
    await token.save();
    return "Incorrect OTP. Please try again.";
  }
  return null;
}

// GET /api/auth/login-history (auth required)
export async function loginHistory(req: AuthedRequest, res: Response) {
  const logs = await LoginLog.find({ admin: req.adminId }).sort({ at: -1 }).limit(100);
  return res.status(200).json({
    logs: logs.map((l) => ({
      id: l.id,
      success: l.success,
      reason: l.reason,
      ip: l.ip,
      browser: l.browser,
      os: l.os,
      deviceModel: l.deviceModel,
      deviceType: l.deviceType,
      at: l.at,
    })),
  });
}
