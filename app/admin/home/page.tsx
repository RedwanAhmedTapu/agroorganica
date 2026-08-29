"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { HOME_GRID_TEMPLATES, getTemplate } from "@/lib/homeTemplates";
import { Brand, HomeGridItem } from "@/lib/types";
import { uid, mediaTypeFromDataUrl, placeholder } from "@/lib/helpers";
import { Card, Btn, UploadBtn, Toggle, Badge, inputCls, inputStyle, C } from "@/components/ui";
import HomeMediaGrid from "@/components/HomeMediaGrid";
import { BulkImportExcel, BulkImportResult } from "@/components/BulkImportExcel";
import AdminHint from "@/components/AdminHint";
import { Check, ChevronLeft, ChevronRight, Trash2, Plus, ImageIcon, Video, Sparkles } from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-10">
      <MediaGridEditor />
      <BrandEditor />
    </div>
  );
}

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

// ---------------- Media grid ----------------

function MediaGridEditor() {
  const { data, setData } = useAppData();
  const grid = data.home.grid;
  const tpl = getTemplate(grid.templateId);
  const slots = 5;
  const items: (HomeGridItem | null)[] = Array.from({ length: slots }, (_, i) => grid.items[i] ?? null);

  const updateGrid = (fn: (items: HomeGridItem[]) => HomeGridItem[]) =>
    setData((d) => ({ ...d, home: { ...d.home, grid: { ...d.home.grid, items: fn(d.home.grid.items) } } }));

  const selectTemplate = (templateId: string) =>
    setData((d) => ({ ...d, home: { ...d.home, grid: { ...d.home.grid, templateId } } }));

  const setSlot = (index: number, files: { name: string; dataUrl: string }[]) => {
    const file = files[0];
    if (!file) return;
    const newItem: HomeGridItem = { id: uid(), type: mediaTypeFromDataUrl(file.dataUrl), src: file.dataUrl };
    updateGrid((its) => {
      const next = [...its];
      if (index < next.length) next[index] = newItem;
      else {
        while (next.length < index) next.push({ id: uid(), type: "image", src: "" });
        next.push(newItem);
      }
      return next;
    });
  };

  const removeSlot = (index: number) => {
    updateGrid((its) => its.filter((_, i) => i !== index));
  };

  const moveSlot = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    updateGrid((its) => {
      const next = [...its];
      // ensure both positions exist so the swap is well defined
      while (next.length <= Math.max(index, target)) next.push({ id: uid(), type: "image", src: "" });
      [next[index], next[target]] = [next[target], next[index]];
      return next.filter((it) => it.src); // drop trailing empties
    });
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Homepage"
        title="Image & Video Grid"
        hint="Pick a layout, then add up to 5 images or videos. Use the arrows to change where each one appears."
      />

      <AdminHint>
        Click a layout below, then use "Add"/"Replace" under each slot to upload an image or short
        video. The arrows reorder slots to match the layout preview.
      </AdminHint>

      {/* Template picker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {HOME_GRID_TEMPLATES.map((t) => {
          const active = t.id === grid.templateId;
          return (
            <button
              key={t.id}
              onClick={() => selectTemplate(t.id)}
              className="text-left rounded-lg p-3 transition-colors relative"
              style={{
                border: `1.5px solid ${active ? C.primary : C.border}`,
                backgroundColor: active ? C.primaryTint : "#fff",
              }}
            >
              {active && (
                <span
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: C.primary }}
                >
                  <Check size={10} color="#fff" />
                </span>
              )}
              <div
                className="grid gap-0.5 mb-2 rounded overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${t.cols}, 1fr)`, gridAutoRows: "10px", gridAutoFlow: "dense" }}
              >
                {t.cells.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      gridColumn: `span ${c.colSpan}`,
                      gridRow: `span ${c.rowSpan}`,
                      backgroundColor: active ? C.primary : C.border,
                      opacity: active ? 0.35 + i * 0.1 : 1,
                    }}
                  />
                ))}
              </div>
              <div className="text-xs font-semibold" style={{ color: C.text }}>
                {t.name}
              </div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: C.muted }}>
                {t.description}
              </div>
            </button>
          );
        })}
      </div>

      <Card className="p-5 mb-6">
        <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>
          Slots for "{tpl.name}" — order below matches the layout above
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <div className="relative aspect-square" style={{ backgroundColor: C.primaryTint }}>
                {item?.src ? (
                  item.type === "video" ? (
                    <video src={item.src} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.src} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ color: C.muted }}>
                    <ImageIcon size={20} />
                    <span className="text-[10px]">Empty slot</span>
                  </div>
                )}
                {item?.src && (
                  <span className="absolute top-1.5 left-1.5">
                    <Badge tone={item.type === "video" ? "gold" : "default"}>
                      {item.type === "video" ? (
                        <span className="flex items-center gap-1">
                          <Video size={9} /> Video
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ImageIcon size={9} /> Image
                        </span>
                      )}
                    </Badge>
                  </span>
                )}
                {item?.src && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(179,70,44,0.9)" }}
                  >
                    <Trash2 size={10} color="#fff" />
                  </button>
                )}
              </div>
              <div className="p-2 flex items-center gap-1.5" style={{ backgroundColor: "#fff" }}>
                <button
                  onClick={() => moveSlot(i, -1)}
                  disabled={i === 0}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                  style={{ border: `1px solid ${C.border}` }}
                  title="Move earlier"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => moveSlot(i, 1)}
                  disabled={i === items.length - 1}
                  className="w-6 h-6 rounded flex items-center justify-center disabled:opacity-30"
                  style={{ border: `1px solid ${C.border}` }}
                  title="Move later"
                >
                  <ChevronRight size={13} />
                </button>
                <div className="flex-1" />
                <UploadBtn
                  small
                  label={item?.src ? "Replace" : "Add"}
                  accept="image/*,video/*"
                  usage="home-grid"
                  onFiles={(files) => setSlot(i, files)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: C.muted }}>
          <Sparkles size={13} /> Live preview
        </div>
        <div className="p-4 rounded-lg" style={{ backgroundColor: C.cream, border: `1px solid ${C.border}` }}>
          <HomeMediaGrid templateId={grid.templateId} items={grid.items} />
        </div>
      </div>
    </div>
  );
}

// ---------------- Brand slider ----------------

function BrandEditor() {
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
              <img src={pendingImage} alt="" className="w-full h-full object-contain" />
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
                <img src={b.image} alt={b.name} className="w-full h-full object-contain" />
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
