"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Lock, User, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Btn, Field, inputCls, inputStyle, C, Card } from "@/components/ui";
import { forgotPasswordStart, forgotPasswordResend, forgotPasswordVerify, ApiError } from "@/lib/api";

type Mode = "login" | "forgot-request" | "forgot-verify";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot-password state
  const [fpUsername, setFpUsername] = useState("");
  const [fpBusy, setFpBusy] = useState(false);
  const [fpMessage, setFpMessage] = useState<string | null>(null);
  const [fpError, setFpError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    try {
      await login(username.trim(), password);
      router.push("/admin");
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setLoginBusy(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpUsername.trim()) return;
    setFpBusy(true);
    setFpError(null);
    setFpMessage(null);
    try {
      const res = await forgotPasswordStart(fpUsername.trim());
      setFpMessage(res.message);
      setMode("forgot-verify");
      startCooldown();
    } catch (err) {
      setFpError(err instanceof ApiError ? err.message : "Could not send OTP.");
    } finally {
      setFpBusy(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setFpBusy(true);
    setFpError(null);
    try {
      const res = await forgotPasswordResend(fpUsername.trim());
      setFpMessage(res.message);
      startCooldown();
    } catch (err) {
      setFpError(err instanceof ApiError ? err.message : "Could not resend OTP.");
    } finally {
      setFpBusy(false);
    }
  };

  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError(null);
    if (newPassword.length < 8) return setFpError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setFpError("Passwords do not match.");
    setFpBusy(true);
    try {
      await forgotPasswordVerify(fpUsername.trim(), otp.trim(), newPassword);
      setFpMessage("Password reset. You can log in now.");
      setMode("login");
      setUsername(fpUsername.trim());
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setFpError(err instanceof ApiError ? err.message : "Could not reset password.");
    } finally {
      setFpBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: C.cream }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: C.primary }}>
            <Leaf size={22} color="#fff" />
          </div>
          <div className="font-serif text-xl" style={{ color: C.primary }}>
            Agro Organica
          </div>
          <div className="text-[11px] uppercase tracking-widest" style={{ color: C.muted }}>
            Admin Panel
          </div>
        </div>

        <Card className="p-6">
          {mode === "login" && (
            <form onSubmit={doLogin}>
              <Field label="Username">
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                  <input
                    className={`${inputCls} pl-9`}
                    style={inputStyle}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                  <input
                    type="password"
                    className={`${inputCls} pl-9`}
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </Field>

              {loginError && (
                <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: C.danger }}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {loginError}
                </div>
              )}

              <Btn type="submit" variant="primary" disabled={loginBusy}>
                {loginBusy && <Loader2 size={14} className="animate-spin" />} {loginBusy ? "Signing in…" : "Sign In"}
              </Btn>

              <button
                type="button"
                onClick={() => {
                  setMode("forgot-request");
                  setFpUsername(username);
                  setFpError(null);
                  setFpMessage(null);
                }}
                className="block mt-4 text-xs underline"
                style={{ color: C.muted }}
              >
                Forgot password?
              </button>
            </form>
          )}

          {mode === "forgot-request" && (
            <form onSubmit={requestOtp}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-xs mb-4"
                style={{ color: C.muted }}
              >
                <ArrowLeft size={13} /> Back to login
              </button>
              <p className="text-sm mb-4" style={{ color: C.text }}>
                Enter your admin username. We'll text a one-time code to the phone number registered to that account.
              </p>
              <Field label="Username">
                <input className={inputCls} style={inputStyle} value={fpUsername} onChange={(e) => setFpUsername(e.target.value)} required />
              </Field>
              {fpError && (
                <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: C.danger }}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {fpError}
                </div>
              )}
              <Btn type="submit" variant="primary" disabled={fpBusy}>
                {fpBusy && <Loader2 size={14} className="animate-spin" />} {fpBusy ? "Sending…" : "Send OTP"}
              </Btn>
            </form>
          )}

          {mode === "forgot-verify" && (
            <form onSubmit={verifyAndReset}>
              <button
                type="button"
                onClick={() => setMode("forgot-request")}
                className="flex items-center gap-1 text-xs mb-4"
                style={{ color: C.muted }}
              >
                <ArrowLeft size={13} /> Back
              </button>
              {fpMessage && (
                <div className="flex items-start gap-1.5 text-xs mb-4 p-2 rounded" style={{ color: C.primary, backgroundColor: C.primaryTint }}>
                  <ShieldCheck size={13} className="mt-0.5 shrink-0" /> {fpMessage}
                </div>
              )}
              <Field label="OTP code">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                  maxLength={8}
                  required
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  className={inputCls}
                  style={inputStyle}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </Field>
              <Field label="Confirm new password">
                <input
                  type="password"
                  className={inputCls}
                  style={inputStyle}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </Field>

              {fpError && (
                <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: C.danger }}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {fpError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Btn type="submit" variant="primary" disabled={fpBusy}>
                  {fpBusy && <Loader2 size={14} className="animate-spin" />} Reset Password
                </Btn>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0 || fpBusy}
                  className="text-xs underline disabled:opacity-40"
                  style={{ color: C.muted }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
