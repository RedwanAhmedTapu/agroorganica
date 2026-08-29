"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { uploadImageFile, uploadPdfFile, ApiError, UploadUsage } from "@/lib/api";
import { UPLOAD_HINTS } from "@/lib/uploadPresets";

export const C = {
  primary: "#1f4b3f",
  primarySoft: "#3f6b52",
  primaryTint: "#e8efe9",
  gold: "#c99a3e",
  cream: "#f7f5ef",
  card: "#ffffff",
  border: "#e4e0d4",
  text: "#26302b",
  muted: "#71786f",
  danger: "#b3462c",
};

export const inputCls = "w-full rounded-md px-3 py-2 text-sm outline-none";
export const inputStyle: React.CSSProperties = { border: `1px solid ${C.border}`, backgroundColor: "#fff", color: C.text };

type BtnVariant = "primary" | "gold" | "outline" | "ghost" | "danger";

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const sizes = { sm: "text-xs px-2.5 py-1.5 gap-1", md: "text-sm px-4 py-2 gap-1.5", lg: "text-base px-5 py-2.5 gap-2" };
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-40";
  const styles: Record<BtnVariant, React.CSSProperties> = {
    primary: { backgroundColor: C.primary, color: "#fff" },
    gold: { backgroundColor: C.gold, color: "#2a2213" },
    outline: { backgroundColor: "transparent", color: C.primary, border: `1px solid ${C.border}` },
    ghost: { backgroundColor: "transparent", color: C.muted },
    danger: { backgroundColor: "transparent", color: C.danger, border: "1px solid #e6c9bd" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]}`} style={styles[variant]}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-lg ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, ...style }}>
      {children}
    </div>
  );
}

export function TwoPane({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      <div className="flex flex-col gap-2">{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function AdminListRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ border: `1px solid ${C.border}`, backgroundColor: "#fff" }}>
      <div className="flex-1 min-w-0">{children}</div>
      <button onClick={onDelete} className="p-1.5 rounded" style={{ color: C.danger }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// Uploads real files to the backend (validated server-side for size,
// format and dimensions — see backend/src/config/uploadPresets.ts) and
// hands back { name, dataUrl } where `dataUrl` is now a real hosted URL
// like /uploads/home/xxx.jpg (kept as `dataUrl` for drop-in compatibility
// with existing call sites that used to store base64 data URLs).
//
// `usage` selects which validation preset applies (home-grid, brand-logo,
// product, media-gallery, profile, achievement). PDFs are detected via the
// `accept` prop and routed to the PDF upload endpoint instead.
export function UploadBtn({
  label = "Upload image",
  accept = "image/*",
  multiple = false,
  onFiles,
  small,
  usage = "site-general",
  showHint = true,
}: {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: { name: string; dataUrl: string }[]) => void;
  small?: boolean;
  usage?: UploadUsage;
  showHint?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPdf = accept.includes("pdf");

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setBusy(true);
    setError(null);
    const results: { name: string; dataUrl: string }[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        if (isPdf) {
          const res = await uploadPdfFile(file);
          results.push({ name: res.originalName || file.name, dataUrl: res.url });
        } else {
          const res = await uploadImageFile(file, usage);
          results.push({ name: file.name, dataUrl: res.url });
        }
      } catch (err) {
        if (err instanceof ApiError) {
          errors.push(...(err.details?.length ? err.details : [err.message]));
        } else {
          errors.push(`Could not upload "${file.name}".`);
        }
      }
    }

    setBusy(false);
    if (errors.length) setError(errors.join(" "));
    if (results.length) onFiles(results);
  };

  return (
    <div className={small ? "" : "inline-block"}>
      <div className="flex items-center gap-2">
        <Btn variant="outline" size={small ? "sm" : "md"} onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 size={small ? 13 : 15} className="animate-spin" /> : <Upload size={small ? 13 : 15} />}
          {busy ? "Uploading…" : label}
        </Btn>
      </div>
      <input ref={ref} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      {showHint && !isPdf && (
        <div className="text-[10px] mt-1 max-w-xs" style={{ color: C.muted }}>
          {UPLOAD_HINTS[usage]}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1 text-[11px] mt-1 max-w-xs" style={{ color: C.danger }}>
          <AlertCircle size={12} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
      title={label}
    >
      <span
        className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: checked ? C.primary : "#d8d3c4" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </span>
      {label && (
        <span className="text-xs font-medium" style={{ color: checked ? C.primary : C.muted }}>
          {label}
        </span>
      )}
    </button>
  );
}

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "gold" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: C.primaryTint, color: C.primary },
    gold: { backgroundColor: "#f7ecd3", color: "#8a6414" },
    danger: { backgroundColor: "#f7e3db", color: C.danger },
  };
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={styles[tone]}>
      {children}
    </span>
  );
}

export function ImageStrip({ images }: { images: string[] }) {
  const [start, setStart] = useState(0);
  const perView = 3;
  const canPrev = start > 0;
  const canNext = start + perView < images.length;
  const visible = images.slice(start, start + perView);
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => canPrev && setStart((s) => s - 1)}
        disabled={!canPrev}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
        style={{ border: `1px solid ${C.border}`, backgroundColor: "#fff" }}
      >
        <ChevronLeft size={16} />
      </button>
      <div className="grid grid-cols-3 gap-4 flex-1">
        {visible.map((src, i) => (
          <div key={start + i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full aspect-[4/3] object-cover" />
          </div>
        ))}
      </div>
      <button
        onClick={() => canNext && setStart((s) => s + 1)}
        disabled={!canNext}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
        style={{ border: `1px solid ${C.border}`, backgroundColor: "#fff" }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
