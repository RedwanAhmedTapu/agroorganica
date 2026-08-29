"use client";

import { useEffect, useState } from "react";
import { Card, Btn, C, inputCls, inputStyle } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { UploadBtn } from "@/components/ui";
import { listAssets, bulkDeleteUploads, Asset, UploadUsage } from "@/lib/api";
import { UPLOAD_HINTS } from "@/lib/uploadPresets";
import { Copy, Check, Trash2, RefreshCw, Loader2 } from "lucide-react";

const USAGE_TABS: { value: UploadUsage | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "product", label: "Product" },
  { value: "brand-logo", label: "Brand Logo" },
  { value: "media-gallery", label: "Media Gallery" },
  { value: "home-grid", label: "Home Grid" },
  { value: "profile", label: "Profile" },
  { value: "achievement", label: "Achievement" },
  { value: "navbar-logo", label: "Navbar Logo" },
  { value: "site-general", label: "General" },
];

function formatSize(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ImageLibraryPage() {
  const [usage, setUsage] = useState<UploadUsage | "all">("all");
  const [uploadUsage, setUploadUsage] = useState<UploadUsage>("product");
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async (u: UploadUsage | "all" = usage) => {
    setLoading(true);
    try {
      const res = await listAssets(u === "all" ? undefined : u);
      setAssets(res.assets);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(usage);
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usage]);

  const copy = async (a: Asset) => {
    try {
      await navigator.clipboard.writeText(a.url);
      setCopiedId(a.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard may be unavailable — user can still select the text field */
    }
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const deleteSelected = async () => {
    if (!assets || selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} image(s) permanently? This can't be undone.`)) return;
    const urls = assets.filter((a) => selected.has(a.id)).map((a) => a.url);
    await bulkDeleteUploads(urls).catch(() => {});
    setSelected(new Set());
    await load(usage);
  };

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.gold }}>
          Admin
        </div>
        <h1 className="font-serif text-2xl" style={{ color: C.primary }}>
          Image Library
        </h1>
      </div>

      <AdminHint>
        This is the <strong>one common place</strong> to upload images. Upload here first, copy the
        URL it gives you, then paste that URL into the <strong>Image URL</strong> column of your
        bulk-import Excel sheet on the Products or Brands page. Pick the right "Uploading as"
        category below so the size/shape check matches where the image will actually be used.
      </AdminHint>

      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: C.muted }}>
              Uploading as
            </label>
            <select
              className={inputCls}
              style={{ ...inputStyle, width: 200 }}
              value={uploadUsage}
              onChange={(e) => setUploadUsage(e.target.value as UploadUsage)}
            >
              {USAGE_TABS.filter((t) => t.value !== "all").map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <UploadBtn
            multiple
            usage={uploadUsage}
            label="Upload image(s)"
            onFiles={() => load(usage)}
          />
        </div>
        <div className="text-[10px] mt-2" style={{ color: C.muted }}>
          {UPLOAD_HINTS[uploadUsage]}
        </div>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        {USAGE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setUsage(t.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: usage === t.value ? C.primary : "#fff",
              color: usage === t.value ? "#fff" : C.text,
              border: `1px solid ${usage === t.value ? C.primary : C.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
        <button onClick={() => load(usage)} className="ml-auto text-xs flex items-center gap-1" style={{ color: C.muted }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh
        </button>
        {selected.size > 0 && (
          <Btn variant="danger" size="sm" onClick={deleteSelected}>
            <Trash2 size={13} /> Delete {selected.size} selected
          </Btn>
        )}
      </div>

      {assets === null ? (
        <p className="text-sm" style={{ color: C.muted }}>
          Loading…
        </p>
      ) : assets.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>
          No uploads in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {assets.map((a) => (
            <Card key={a.id} className="p-2 overflow-hidden">
              <div
                className="relative rounded-md overflow-hidden mb-2 cursor-pointer"
                style={{ border: `1px solid ${selected.has(a.id) ? C.primary : C.border}` }}
                onClick={() => toggleSelected(a.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.originalName} className="w-full aspect-square object-cover" />
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleSelected(a.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1.5 left-1.5 w-4 h-4"
                />
              </div>
              <div className="text-[10px] truncate mb-1" style={{ color: C.muted }} title={a.originalName}>
                {a.originalName || a.url.split("/").pop()}
              </div>
              <div className="text-[10px] mb-1.5" style={{ color: C.muted }}>
                {a.width && a.height ? `${a.width}×${a.height} · ` : ""}
                {formatSize(a.size)}
              </div>
              <div className="flex items-center gap-1">
                <input readOnly value={a.url} className={`${inputCls} text-[10px] py-1`} style={inputStyle} onFocus={(e) => e.target.select()} />
                <button
                  onClick={() => copy(a)}
                  className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: C.primaryTint }}
                  title="Copy URL"
                >
                  {copiedId === a.id ? <Check size={13} style={{ color: C.primary }} /> : <Copy size={13} style={{ color: C.primary }} />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
