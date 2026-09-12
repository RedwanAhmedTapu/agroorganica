"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { Brand } from "@/lib/types";
import { uid, placeholder } from "@/lib/helpers";
import { getFileUrl } from "@/lib/api";
import { Card, Btn, UploadBtn, Toggle, Badge, inputCls, inputStyle, C } from "@/components/ui";
import { BulkImportExcel, BulkImportResult } from "@/components/BulkImportExcel";
import AdminHint from "@/components/AdminHint";
import { Trash2, Plus, ImageIcon } from "lucide-react";

function SectionHeader({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.gold }}>
        {eyebrow}
      </div>
      <h2 className="font-serif text-2xl" style={{ color: C.primary }}>
        {title}
      </h2>
      {hint && (
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// Standalone "Brand Slider" admin page — pulled out of Home Page settings
// into its own page so brand logos have their own dedicated place to be
// managed instead of being mixed in with the homepage image/video grid.
export default function AdminBrandsPage() {
  const { data, setData } = useAppData();
  const brands = data.home.brands;
  const [name, setName] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const update = (fn: (bs: Brand[]) => Brand[]) => setData((d) => ({ ...d, home: { ...d.home, brands: fn(d.home.brands) } }));

  const addBrand = () => {
    if (!name.trim() || !pendingImage) return;
    update((bs) => [...bs, { id: uid(), name: name.trim(), image: pendingImage, active: true }]);
    setName("");
    setPendingImage(null);
  };

  const removeBrand = (id: string) => update((bs) => bs.filter((b) => b.id !== id));
  const toggleActive = (id: string) => update((bs) => bs.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));

  const activeCount = brands.filter((b) => b.active).length;

  const handleBulkImportBrands = (rows: Record<string, string>[]): BulkImportResult => {
    let added = 0;
    let skipped = 0;
    const newBrands: Brand[] = [];
    for (const row of rows) {
      const brandName = (row.brandName || "").trim();
      const imageUrl = (row.imageUrl || "").trim();
      const activeRaw = (row.active || "").trim().toLowerCase();
      if (!brandName) {
        skipped++;
        continue;
      }
      newBrands.push({
        id: uid(),
        name: brandName,
        image: imageUrl || placeholder(brandName.slice(0, 2).toUpperCase()),
        active: activeRaw !== "no" && activeRaw !== "false" && activeRaw !== "0",
      });
      added++;
    }
    if (newBrands.length) update((bs) => [...bs, ...newBrands]);
    return { added, skipped };
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Homepage"
        title="Brand Slider"
        hint="Add brand logos below. Only brands marked Active appear in the homepage slider."
      />

      <AdminHint>
        Add one brand at a time below, or use <strong>Bulk Add Brands</strong> to add many from an
        Excel sheet. Toggle "Active" to control which brands show in the homepage slider without
        deleting them.
      </AdminHint>

      <BulkImportExcel
        title="Bulk Add Brands (Excel)"
        templateFilename="agro-organica-brands-template.xlsx"
        instructions={
          <>
            Columns: <strong>Brand Name</strong>, <strong>Image URL</strong> (upload the logo in{" "}
            <a href="/admin/image-library" className="underline" style={{ color: C.primary }}>
              Image Library
            </a>{" "}
            first and paste the URL here), and <strong>Active</strong> ("Yes" or "No" — defaults to
            Yes if left blank).
          </>
        }
        columns={[
          { key: "brandName", label: "Brand Name", example: "Khusboo" },
          { key: "imageUrl", label: "Image URL", example: "/uploads/brands/xxxxx.png" },
          { key: "active", label: "Active", example: "Yes" },
        ]}
        onImport={handleBulkImportBrands}
      />

      <Card className="p-5 mb-5 mt-5">
        <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>
          Add a brand
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div
            className="w-16 h-16 rounded-md shrink-0 flex items-center justify-center overflow-hidden"
            style={{ border: `1px dashed ${C.border}`, backgroundColor: C.primaryTint }}
          >
            {pendingImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFileUrl(pendingImage)} alt="" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={18} style={{ color: C.muted }} />
            )}
          </div>
          <UploadBtn label="Choose logo" usage="brand-logo" onFiles={(files) => files[0] && setPendingImage(files[0].dataUrl)} />
          <input
            placeholder="Brand name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputCls} sm:w-56`}
            style={inputStyle}
          />
          <Btn onClick={addBrand} disabled={!name.trim() || !pendingImage}>
            <Plus size={14} /> Add brand
          </Btn>
        </div>
      </Card>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold" style={{ color: C.muted }}>
          {brands.length} brand{brands.length === 1 ? "" : "s"} total
        </span>
        <Badge>{activeCount} active</Badge>
      </div>

      {brands.length === 0 ? (
        <p className="text-sm" style={{ color: C.muted }}>
          No brands added yet.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {brands.map((b) => (
            <Card key={b.id} className="p-3 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-md shrink-0 flex items-center justify-center overflow-hidden"
                style={{ border: `1px solid ${C.border}`, backgroundColor: C.primaryTint }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getFileUrl(b.image)} alt={b.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: C.text }}>
                  {b.name}
                </div>
                <div className="mt-1">
                  <Toggle checked={b.active} onChange={() => toggleActive(b.id)} label={b.active ? "Active" : "Inactive"} />
                </div>
              </div>
              <button onClick={() => removeBrand(b.id)} className="p-1.5 rounded shrink-0" style={{ color: C.danger }}>
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}