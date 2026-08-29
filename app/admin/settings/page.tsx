"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  History,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  XCircle,
  Trash2,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useAppData } from "@/lib/DataContext";
import { Card, Btn, Field, inputCls, inputStyle, C, Badge } from "@/components/ui";
import {
  changePasswordStart,
  changePasswordResend,
  changePasswordVerify,
  getLoginHistory,
  LoginLogEntry,
  ApiError,
  bulkDeleteUploads,
  getFooterSettings,
  saveFooterSettings,
  SocialLink,
} from "@/lib/api";
import { UploadBtn } from "@/components/ui";
import AdminHint from "@/components/AdminHint";

type ChangeStep = "form" | "otp";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { admin, logout } = useAuth();
  const { data, setData } = useAppData();

  // ---------------- Change password ----------------
  const [step, setStep] = useState<ChangeStep>("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    setError(null);
    if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    try {
      const res = await changePasswordStart(currentPassword);
      setMessage(res.message);
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start password change.");
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await changePasswordResend();
      setMessage(res.message);
      startCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend OTP.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await changePasswordVerify(otp.trim(), newPassword);
      setMessage("Password changed successfully.");
      setStep("form");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  };

  // ---------------- Login history ----------------
  const [logs, setLogs] = useState<LoginLogEntry[] | null>(null);
  useEffect(() => {
    getLoginHistory()
      .then((r) => setLogs(r.logs))
      .catch(() => setLogs([]));
  }, []);

  const deviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone size={13} />;
    if (type === "tablet") return <Tablet size={13} />;
    return <Monitor size={13} />;
  };

  // ---------------- Footer social links ----------------
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [allowedIcons, setAllowedIcons] = useState<string[]>([]);
  const [footerBusy, setFooterBusy] = useState(false);
  const [footerMsg, setFooterMsg] = useState<string | null>(null);

  useEffect(() => {
    getFooterSettings()
      .then((r) => {
        setSocialLinks(r.socialLinks);
        setAllowedIcons(r.allowedIcons);
      })
      .catch(() => {});
  }, []);

  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, platform: "", icon: allowedIcons[0] || "Globe", url: "", active: true },
    ]);
  };
  const updateSocialLink = (id: string, patch: Partial<SocialLink>) =>
    setSocialLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeSocialLink = (id: string) => setSocialLinks((prev) => prev.filter((l) => l.id !== id));

  const saveSocialLinks = async () => {
    setFooterBusy(true);
    setFooterMsg(null);
    try {
      const cleaned = socialLinks.filter((l) => l.platform.trim() && l.url.trim());
      const res = await saveFooterSettings(cleaned);
      setSocialLinks(res.socialLinks);
      setFooterMsg("Footer social links saved.");
    } catch (err) {
      setFooterMsg(err instanceof ApiError ? err.message : "Could not save social links.");
    } finally {
      setFooterBusy(false);
    }
  };

  // ---------------- Danger zone: bulk clear demo content ----------------
  const clearSection = async (label: string, apply: () => void, urlsToDelete: string[]) => {
    if (!window.confirm(`Remove all ${label}? This can't be undone.`)) return;
    apply();
    const real = urlsToDelete.filter((u) => u.startsWith("/uploads/"));
    if (real.length) await bulkDeleteUploads(real).catch(() => {});
  };

  const clearHomeGrid = () =>
    clearSection(
      "homepage grid images/videos",
      () => setData((d) => ({ ...d, home: { ...d.home, grid: { ...d.home.grid, items: [] } } })),
      data.home.grid.items.map((i) => i.src)
    );

  const clearBrands = () =>
    clearSection(
      "brand logos",
      () => setData((d) => ({ ...d, home: { ...d.home, brands: [] } })),
      data.home.brands.map((b) => b.image)
    );

  const clearAllProducts = () =>
    clearSection(
      "products (categories are kept)",
      () =>
        setData((d) => ({
          ...d,
          brandsProducts: { categories: d.brandsProducts.categories.map((c) => ({ ...c, products: [] })) },
        })),
      data.brandsProducts.categories.flatMap((c) => c.products.map((p) => p.image))
    );

  const clearAllMedia = () =>
    clearSection(
      "media gallery images (galleries are kept)",
      () => setData((d) => ({ ...d, media: { sections: d.media.sections.map((s) => ({ ...s, images: [] })) } })),
      data.media.sections.flatMap((s) => s.images)
    );

  const clearAllMessages = () =>
    clearSection(
      "contact messages",
      () => setData((d) => ({ ...d, messages: [] })),
      []
    );

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.gold }}>
          Admin
        </div>
        <h1 className="font-serif text-2xl" style={{ color: C.primary }}>
          Settings
        </h1>
        {admin && (
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            Signed in as <strong>{admin.username}</strong> · OTPs are sent to {admin.phone}
          </p>
        )}
      </div>

      {/* Navbar / brand identity */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={16} style={{ color: C.primary }} />
          <h2 className="font-serif text-lg" style={{ color: C.primary }}>
            Site Branding — Navbar & Footer
          </h2>
        </div>
        <AdminHint>
          These three appear together in the navbar (and the logo + name in the footer): a square
          logo mark, the company name, and the small subtitle line underneath it. Upload a logo to
          replace the default leaf icon — it's validated to a fixed square shape so it always fits
          neatly in its badge on phones, tablets and desktop. Remove it any time to go back to the
          default icon.
        </AdminHint>
        <div className="flex items-center gap-4 mt-3 mb-5">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: C.primary, border: `1px solid ${C.border}` }}
          >
            {data.siteSettings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.siteSettings.logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-[9px] text-center leading-tight px-1" style={{ color: "#bcd2c4" }}>
                Default icon
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <UploadBtn
              small
              usage="navbar-logo"
              label={data.siteSettings?.logoUrl ? "Replace logo" : "Upload logo"}
              onFiles={(f) => {
                const old = data.siteSettings?.logoUrl;
                setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, logoUrl: f[0]?.dataUrl || d.siteSettings?.logoUrl } }));
                if (old?.startsWith("/uploads/")) bulkDeleteUploads([old]).catch(() => {});
              }}
            />
            {data.siteSettings?.logoUrl && (
              <button
                className="text-xs underline text-left"
                style={{ color: C.danger }}
                onClick={() => {
                  const old = data.siteSettings.logoUrl;
                  setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, logoUrl: "" } }));
                  if (old?.startsWith("/uploads/")) bulkDeleteUploads([old]).catch(() => {});
                }}
              >
                Remove logo (use default icon)
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-4">
          <Field label="Company name">
            <input
              className={inputCls}
              style={inputStyle}
              value={data.siteSettings?.companyName || ""}
              onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, companyName: e.target.value } }))}
              placeholder="Agro Organica"
            />
          </Field>
          <Field label="Subtitle (shown under the name)">
            <input
              className={inputCls}
              style={inputStyle}
              value={data.siteSettings?.companySubtitle || ""}
              onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, companySubtitle: e.target.value } }))}
              placeholder="Nurture Nature"
            />
          </Field>
        </div>
      </Card>

      {/* Footer content */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon size={16} style={{ color: C.primary }} />
          <h2 className="font-serif text-lg" style={{ color: C.primary }}>
            Footer Content
          </h2>
        </div>
        <AdminHint>
          Everything in the footer except the Quick Links column can be edited here: the brand
          blurb, the contact details, and the "Our Brand" paragraph.
        </AdminHint>
        <Field label="Footer brand description (under the logo)">
          <textarea
            rows={3}
            className={inputCls}
            style={inputStyle}
            value={data.siteSettings?.footerDescription || ""}
            onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, footerDescription: e.target.value } }))}
          />
        </Field>
        <Field label='"Our Brand" column text'>
          <textarea
            rows={3}
            className={inputCls}
            style={inputStyle}
            value={data.siteSettings?.ourBrandText || ""}
            onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, ourBrandText: e.target.value } }))}
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-x-4">
          <Field label="Address">
            <input
              className={inputCls}
              style={inputStyle}
              value={data.siteSettings?.contactAddress || ""}
              onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, contactAddress: e.target.value } }))}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              style={inputStyle}
              value={data.siteSettings?.contactPhone || ""}
              onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, contactPhone: e.target.value } }))}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              style={inputStyle}
              value={data.siteSettings?.contactEmail || ""}
              onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, contactEmail: e.target.value } }))}
            />
          </Field>
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} style={{ color: C.primary }} />
          <h2 className="font-serif text-lg" style={{ color: C.primary }}>
            Change Password
          </h2>
        </div>

        {step === "form" && (
          <form onSubmit={requestOtp}>
            <Field label="Current password">
              <input
                type="password"
                className={inputCls}
                style={inputStyle}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
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
            {error && (
              <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: C.danger }}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <Btn type="submit" variant="primary" disabled={busy}>
              {busy && <Loader2 size={14} className="animate-spin" />} Send OTP to my phone
            </Btn>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp}>
            {message && (
              <div className="flex items-start gap-1.5 text-xs mb-4 p-2 rounded" style={{ color: C.primary, backgroundColor: C.primaryTint }}>
                <ShieldCheck size={13} className="mt-0.5 shrink-0" /> {message}
              </div>
            )}
            <Field label="OTP code (expires in 5 minutes)">
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
            {error && (
              <div className="flex items-start gap-1.5 text-xs mb-3" style={{ color: C.danger }}>
                <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Btn type="submit" variant="primary" disabled={busy}>
                {busy && <Loader2 size={14} className="animate-spin" />} Confirm change
              </Btn>
              <button
                type="button"
                onClick={resendOtp}
                disabled={resendCooldown > 0 || busy}
                className="text-xs underline disabled:opacity-40"
                style={{ color: C.muted }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
              <button type="button" onClick={() => setStep("form")} className="text-xs underline" style={{ color: C.muted }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Footer social links */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={16} style={{ color: C.primary }} />
          <h2 className="font-serif text-lg" style={{ color: C.primary }}>
            Footer Social Links
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          Choose an icon and paste the link for each platform. Quick Links in the footer stay fixed and aren't editable here.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          {socialLinks.map((link) => (
            <div key={link.id} className="flex flex-wrap items-center gap-2 p-3 rounded-md" style={{ border: `1px solid ${C.border}` }}>
              <select
                className={inputCls}
                style={{ ...inputStyle, width: 140 }}
                value={link.icon}
                onChange={(e) => updateSocialLink(link.id, { icon: e.target.value })}
              >
                {allowedIcons.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <input
                placeholder="Platform (e.g. Facebook)"
                className={inputCls}
                style={{ ...inputStyle, width: 160 }}
                value={link.platform}
                onChange={(e) => updateSocialLink(link.id, { platform: e.target.value })}
              />
              <input
                placeholder="https://..."
                className={`${inputCls} flex-1 min-w-[180px]`}
                style={inputStyle}
                value={link.url}
                onChange={(e) => updateSocialLink(link.id, { url: e.target.value })}
              />
              <button onClick={() => removeSocialLink(link.id)} style={{ color: C.danger }}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {socialLinks.length === 0 && (
            <p className="text-sm" style={{ color: C.muted }}>
              No social links yet.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Btn variant="outline" size="sm" onClick={addSocialLink}>
            + Add link
          </Btn>
          <Btn size="sm" onClick={saveSocialLinks} disabled={footerBusy}>
            {footerBusy && <Loader2 size={13} className="animate-spin" />} Save
          </Btn>
          {footerMsg && (
            <span className="text-xs" style={{ color: C.muted }}>
              {footerMsg}
            </span>
          )}
        </div>
      </Card>

      {/* Login history */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <History size={16} style={{ color: C.primary }} />
          <h2 className="font-serif text-lg" style={{ color: C.primary }}>
            Login History
          </h2>
        </div>
        {logs === null ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Loading…
          </p>
        ) : logs.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>
            No login history yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-auto">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-md text-xs" style={{ border: `1px solid ${C.border}` }}>
                {l.success ? <CheckCircle2 size={14} style={{ color: C.primary }} /> : <XCircle size={14} style={{ color: C.danger }} />}
                <span className="flex items-center gap-1" style={{ color: C.text }}>
                  {deviceIcon(l.deviceType)} {l.deviceModel}
                </span>
                <span style={{ color: C.muted }}>{l.browser}</span>
                <span style={{ color: C.muted }}>{l.os}</span>
                <span style={{ color: C.muted }}>{l.ip}</span>
                <span className="ml-auto" style={{ color: C.muted }}>
                  {new Date(l.at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Danger zone: bulk delete demo content */}
      <Card className="p-5" style={{ borderColor: "#e6c9bd" }}>
        <div className="flex items-center gap-2 mb-1">
          <Trash2 size={16} style={{ color: C.danger }} />
          <h2 className="font-serif text-lg" style={{ color: C.danger }}>
            Danger Zone — Bulk Delete
          </h2>
        </div>
        <p className="text-xs mb-4" style={{ color: C.muted }}>
          Quickly clear out the placeholder/demo content seeded on first install. Each action asks for confirmation and can't be undone.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn variant="danger" size="sm" onClick={clearHomeGrid}>
            Clear homepage grid
          </Btn>
          <Btn variant="danger" size="sm" onClick={clearBrands}>
            Clear brand logos
          </Btn>
          <Btn variant="danger" size="sm" onClick={clearAllProducts}>
            Clear all products
          </Btn>
          <Btn variant="danger" size="sm" onClick={clearAllMedia}>
            Clear all media images
          </Btn>
          <Btn variant="danger" size="sm" onClick={clearAllMessages}>
            Clear all messages
          </Btn>
        </div>
      </Card>

      <Btn
        variant="outline"
        onClick={async () => {
          await logout();
          router.push("/admin/login");
        }}
      >
        Log out
      </Btn>
    </div>
  );
}
