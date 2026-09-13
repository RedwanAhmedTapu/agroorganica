"use client";

import { useEffect, useRef, useState } from "react";
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
  Plus,
  ShoppingBag,
  FileText,
  LogOut,
  Sparkles,
  Phone,
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
  getFileUrl,
  SocialLink,
} from "@/lib/api";
import { UploadBtn } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { collectNodeImages } from "@/lib/helpers";

type ChangeStep = "form" | "otp";
type SettingsTab = "branding" | "contactPage" | "footer" | "security" | "danger";

const TABS: { key: SettingsTab; label: string; icon: typeof ImageIcon }[] = [
  { key: "branding", label: "Branding & Navbar", icon: ImageIcon },
  { key: "contactPage", label: "Contact Page", icon: Phone },
  { key: "footer", label: "Footer", icon: Share2 },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "danger", label: "Danger Zone", icon: Trash2 },
];

// Small pill shown on cards whose fields save automatically (as soon as you
// type) versus ones with an explicit Save button — this used to be
// unclear, so every card now says exactly how it behaves.
function SaveModeBadge({ mode }: { mode: "auto" | "manual" }) {
  return mode === "auto" ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: C.primaryTint, color: C.primary }}>
      <Sparkles size={10} /> Saves automatically
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f7ecd3", color: "#8a6414" }}>
      Click Save when done
    </span>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { admin, logout } = useAuth();
  const { data, setData } = useAppData();
  const [activeTab, setActiveTab] = useState<SettingsTab>("branding");

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

  // ---------------- Footer social links, certification badges & brochure ----------------
  // Quick Links / Investors / Media are NOT managed here — they're generated
  // automatically from the Company Profile, Investor Relation and Media
  // pages (see components/SiteFooter.tsx), the same way the navbar
  // dropdowns are. Only what has no other source of truth lives here.
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [allowedIcons, setAllowedIcons] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [productBrochureUrl, setProductBrochureUrl] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [footerBusy, setFooterBusy] = useState(false);
  const [footerMsg, setFooterMsg] = useState<string | null>(null);
  const [footerLoaded, setFooterLoaded] = useState(false);

  // Snapshot of what's actually saved on the server, used only to detect
  // unsaved edits (drives the "Unsaved changes" badge + sticky save bar).
  const footerSnapshotRef = useRef<string>("");

  const loadFooter = () =>
    getFooterSettings()
      .then((r) => {
        setSocialLinks(r.socialLinks);
        setAllowedIcons(r.allowedIcons);
        setCertifications(r.certifications || []);
        setProductBrochureUrl(r.productBrochureUrl || "");
        footerSnapshotRef.current = JSON.stringify({
          socialLinks: r.socialLinks,
          certifications: r.certifications || [],
          productBrochureUrl: r.productBrochureUrl || "",
        });
        setFooterLoaded(true);
      })
      .catch(() => {});

  useEffect(() => {
    loadFooter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const footerDirty =
    footerLoaded &&
    footerSnapshotRef.current !== JSON.stringify({ socialLinks, certifications, productBrochureUrl });

  const addSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, platform: "", icon: allowedIcons[0] || "Globe", url: "", active: true },
    ]);
  };
  const updateSocialLink = (id: string, patch: Partial<SocialLink>) =>
    setSocialLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const removeSocialLink = (id: string) => setSocialLinks((prev) => prev.filter((l) => l.id !== id));

  // Certification badges (BSTI, ISO-22000, HACCP, HALAL, …)
  const addCertification = () => {
    if (!newCertification.trim()) return;
    setCertifications((prev) => [...prev, newCertification.trim()]);
    setNewCertification("");
  };
  const removeCertification = (i: number) => setCertifications((prev) => prev.filter((_, idx) => idx !== i));

  const saveFooterAll = async () => {
    setFooterBusy(true);
    setFooterMsg(null);
    try {
      const cleanedSocial = socialLinks.filter((l) => l.platform.trim() && l.url.trim());
      const res = await saveFooterSettings({
        socialLinks: cleanedSocial,
        certifications,
        productBrochureUrl: productBrochureUrl.trim(),
      });
      setSocialLinks(res.socialLinks);
      setCertifications(res.certifications);
      setProductBrochureUrl(res.productBrochureUrl);
      footerSnapshotRef.current = JSON.stringify({
        socialLinks: res.socialLinks,
        certifications: res.certifications,
        productBrochureUrl: res.productBrochureUrl,
      });
      setFooterMsg("Footer settings saved.");
    } catch (err) {
      setFooterMsg(err instanceof ApiError ? err.message : "Could not save footer settings.");
    } finally {
      setFooterBusy(false);
    }
  };

  const discardFooterChanges = () => {
    if (!window.confirm("Discard your unsaved footer changes?")) return;
    setFooterMsg(null);
    loadFooter();
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
      "products (root categories are kept, everything nested under them is removed)",
      () =>
        setData((d) => ({
          ...d,
          brandsProducts: { categories: d.brandsProducts.categories.map((c) => ({ ...c, children: [] })) },
        })),
      data.brandsProducts.categories.flatMap((c) => collectNodeImages(c.children))
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
    <div className="flex flex-col gap-6 max-w-2xl pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
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
        <button
          onClick={async () => {
            await logout();
            router.push("/admin/login");
          }}
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md"
          style={{ border: `1px solid ${C.border}`, color: C.danger }}
        >
          <LogOut size={13} /> Log out
        </button>
      </div>

      {/* Tab bar — groups a long settings page into focused sections so you
          don't have to scroll past unrelated cards to find what you need. */}
      <div className="sticky top-14 z-10 -mx-4 px-4 py-2 flex gap-2 overflow-x-auto" style={{ backgroundColor: C.cream }}>
        {TABS.map((t) => {
          const active = t.key === activeTab;
          const Icon = t.icon;
          const showDot = t.key === "footer" && footerDirty;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors"
              style={{
                backgroundColor: active ? C.primary : "#fff",
                color: active ? "#fff" : C.text,
                border: `1px solid ${active ? C.primary : C.border}`,
              }}
            >
              <Icon size={13} />
              {t.label}
              {showDot && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: active ? "#fff" : C.gold }}
                  title="Unsaved changes"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------- Branding & Navbar ---------------- */}
      {activeTab === "branding" && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <ImageIcon size={16} style={{ color: C.primary }} />
              <h2 className="font-serif text-lg" style={{ color: C.primary }}>
                Site Branding — Navbar & Footer
              </h2>
            </div>
            <SaveModeBadge mode="auto" />
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
                <img src={getFileUrl(data.siteSettings.logoUrl)} alt="Logo preview" className="w-full h-full object-contain p-1.5" />
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

          <div className="flex items-center gap-2 mt-6 mb-1">
            <ShoppingBag size={15} style={{ color: C.primary }} />
            <h3 className="text-sm font-semibold" style={{ color: C.primary }}>
              Navbar "Online Shop" button
            </h3>
          </div>
          <AdminHint>
            Optional pill button shown at the end of the navbar (and in the mobile menu). Leave the
            URL empty to hide it. Paste any outside website URL (e.g. your marketplace or a separate
            shop domain) — it opens in a new tab.
          </AdminHint>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="Button label">
              <input
                className={inputCls}
                style={inputStyle}
                value={data.siteSettings?.onlineShopLabel || ""}
                onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, onlineShopLabel: e.target.value } }))}
                placeholder="Online Shop"
              />
            </Field>
            <Field label="Button link (outside URL, or leave blank to hide)">
              <input
                className={inputCls}
                style={inputStyle}
                value={data.siteSettings?.onlineShopUrl || ""}
                onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, onlineShopUrl: e.target.value } }))}
                placeholder="https://shop.example.com"
              />
            </Field>
          </div>
        </Card>
      )}

      {/* ---------------- Contact Page ---------------- */}
      {activeTab === "contactPage" && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Phone size={16} style={{ color: C.primary }} />
              <h2 className="font-serif text-lg" style={{ color: C.primary }}>
                Contact Page
              </h2>
            </div>
            <SaveModeBadge mode="auto" />
          </div>
          <AdminHint>
            The heading, intro line and form title shown on the public Contact page. The phone,
            email and address shown there come from{" "}
            <button type="button" onClick={() => setActiveTab("footer")} className="underline" style={{ color: C.primary }}>
              Footer Content
            </button>{" "}
            (the same details shown in the site footer) so they only need to be kept correct in one
            place.
          </AdminHint>
          <Field label='Page heading (e.g. "Contact Us")'>
            <input
              className={inputCls}
              style={inputStyle}
              value={data.contactPage?.heading || ""}
              onChange={(e) => setData((d) => ({ ...d, contactPage: { ...d.contactPage, heading: e.target.value } }))}
              placeholder="Contact Us"
            />
          </Field>
          <Field label="Intro line (under the heading)">
            <textarea
              rows={2}
              className={inputCls}
              style={inputStyle}
              value={data.contactPage?.intro || ""}
              onChange={(e) => setData((d) => ({ ...d, contactPage: { ...d.contactPage, intro: e.target.value } }))}
              placeholder="Fill up the form and our team will get back to you within 24 hours."
            />
          </Field>
          <Field label='Form section title (e.g. "For Further Query")'>
            <input
              className={inputCls}
              style={inputStyle}
              value={data.contactPage?.formHeading || ""}
              onChange={(e) => setData((d) => ({ ...d, contactPage: { ...d.contactPage, formHeading: e.target.value } }))}
              placeholder="For Further Query"
            />
          </Field>
        </Card>
      )}

      {/* ---------------- Footer ---------------- */}
      {activeTab === "footer" && (
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} style={{ color: C.primary }} />
                <h2 className="font-serif text-lg" style={{ color: C.primary }}>
                  Footer Content
                </h2>
              </div>
              <SaveModeBadge mode="auto" />
            </div>
            <AdminHint>
              The brand blurb, contact details and website shown in the footer. Quick Links,
              Investors, Media, certification badges, social links and the Product Brochure button
              are all managed in the card below.
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
            <div className="grid sm:grid-cols-4 gap-x-4">
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
              <Field label="Website">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={data.siteSettings?.contactWebsite || ""}
                  onChange={(e) => setData((d) => ({ ...d, siteSettings: { ...d.siteSettings, contactWebsite: e.target.value } }))}
                  placeholder="www.example.com"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Share2 size={16} style={{ color: C.primary }} />
                <h2 className="font-serif text-lg" style={{ color: C.primary }}>
                  Badges, Brochure & Social
                </h2>
              </div>
              {footerDirty ? <SaveModeBadge mode="manual" /> : <Badge>All changes saved</Badge>}
            </div>
            <AdminHint>
              Everything below is saved together — scroll down or use the bar at the bottom of the
              screen once you've made a change. The footer's <strong>Quick Links</strong>,{" "}
              <strong>Investors</strong> and <strong>Media</strong> columns aren't edited here — they're
              generated automatically from{" "}
              <a href="/admin/company-profile" className="underline" style={{ color: C.primary }}>
                About Us
              </a>
              ,{" "}
              <a href="/admin/investor-relation" className="underline" style={{ color: C.primary }}>
                Investors
              </a>{" "}
              and{" "}
              <a href="/admin/media" className="underline" style={{ color: C.primary }}>
                Media
              </a>
              , the same content that fills the navbar dropdowns. Add, rename or remove a tab, item or
              gallery on one of those pages and the footer updates itself — nothing to keep in sync by
              hand.
            </AdminHint>

            {/* Certification badges */}
            <div className="text-sm font-semibold mt-2 mb-2" style={{ color: C.text }}>
              Certification badges (e.g. BSTI, ISO-22000, HACCP, HALAL)
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {certifications.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase px-2.5 py-1 rounded"
                  style={{ border: `1px solid ${C.border}`, color: C.text }}
                >
                  {c}
                  <button onClick={() => removeCertification(i)} style={{ color: C.danger }}>
                    <Trash2 size={11} />
                  </button>
                </span>
              ))}
              {certifications.length === 0 && (
                <p className="text-sm" style={{ color: C.muted }}>
                  No badges yet.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input
                placeholder="e.g. ISO-22000"
                className={inputCls}
                style={{ ...inputStyle, width: 200 }}
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCertification()}
              />
              <Btn variant="outline" size="sm" onClick={addCertification}>
                <Plus size={12} /> Add badge
              </Btn>
            </div>

            {/* Product Brochure */}
            <div className="flex items-center gap-2 mb-2">
              <FileText size={15} style={{ color: C.primary }} />
              <div className="text-sm font-semibold" style={{ color: C.text }}>
                Product Brochure (vertical tab on the footer edge)
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: C.muted }}>
              Upload a PDF from the{" "}
              <a href="/admin/image-library" className="underline" style={{ color: C.primary }}>
                Image Library
              </a>{" "}
              and paste its URL here, or paste any outside link. Leave blank to hide the tab.
            </p>
            <input
              placeholder="/uploads/... or https://..."
              className={`${inputCls} mb-6`}
              style={inputStyle}
              value={productBrochureUrl}
              onChange={(e) => setProductBrochureUrl(e.target.value)}
            />

            {/* Social links */}
            <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>
              Social links
            </div>
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
            <Btn variant="outline" size="sm" onClick={addSocialLink}>
              + Add link
            </Btn>

            <div className="flex items-center gap-3 mt-6 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <Btn size="sm" onClick={saveFooterAll} disabled={footerBusy || !footerDirty}>
                {footerBusy && <Loader2 size={13} className="animate-spin" />} Save footer settings
              </Btn>
              {footerDirty && (
                <Btn variant="ghost" size="sm" onClick={discardFooterChanges}>
                  Discard changes
                </Btn>
              )}
              {footerMsg && (
                <span className="text-xs" style={{ color: C.muted }}>
                  {footerMsg}
                </span>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- Security ---------------- */}
      {activeTab === "security" && (
        <div className="flex flex-col gap-6">
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
                  <div key={l.id} className="flex items-center gap-3 px-3 py-2 rounded-md text-xs flex-wrap" style={{ border: `1px solid ${C.border}` }}>
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
        </div>
      )}

      {/* ---------------- Danger Zone ---------------- */}
      {activeTab === "danger" && (
        <Card className="p-5" style={{ borderColor: "#e6c9bd" }}>
          <div className="flex items-center gap-2 mb-1">
            <Trash2 size={16} style={{ color: C.danger }} />
            <h2 className="font-serif text-lg" style={{ color: C.danger }}>
              Bulk Delete
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: C.muted }}>
            Quickly clear out the placeholder/demo content seeded on first install. Each action asks
            for confirmation and can't be undone.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Clear homepage grid", desc: "Removes all images/videos from the homepage grid.", onClick: clearHomeGrid },
              { label: "Clear brand logos", desc: "Empties the homepage brand slider.", onClick: clearBrands },
              { label: "Clear all products", desc: "Removes products but keeps your categories.", onClick: clearAllProducts },
              { label: "Clear all media images", desc: "Empties media galleries but keeps the galleries.", onClick: clearAllMedia },
              { label: "Clear all messages", desc: "Deletes every submitted contact message.", onClick: clearAllMessages },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-md flex flex-col gap-2" style={{ border: `1px solid ${C.border}` }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: C.text }}>
                    {item.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>
                    {item.desc}
                  </div>
                </div>
                <Btn variant="danger" size="sm" onClick={item.onClick}>
                  {item.label}
                </Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sticky save bar — only shows on the Footer tab once something has
          changed, so you don't have to scroll back down to find Save. */}
      {activeTab === "footer" && footerDirty && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-center gap-3"
          style={{ backgroundColor: "#fff", borderTop: `1px solid ${C.border}`, boxShadow: "0 -2px 10px rgba(0,0,0,0.06)" }}
        >
          <span className="text-xs font-medium" style={{ color: C.text }}>
            You have unsaved footer changes.
          </span>
          <Btn size="sm" onClick={saveFooterAll} disabled={footerBusy}>
            {footerBusy && <Loader2 size={13} className="animate-spin" />} Save now
          </Btn>
          <Btn variant="ghost" size="sm" onClick={discardFooterChanges}>
            Discard
          </Btn>
        </div>
      )}
    </div>
  );
}