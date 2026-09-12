"use client";

import { useAppData } from "@/lib/DataContext";
import { HOME_GRID_TEMPLATES, getTemplate } from "@/lib/homeTemplates";
import { HomeGridItem } from "@/lib/types";
import { uid, mediaTypeFromDataUrl } from "@/lib/helpers";
import { getFileUrl } from "@/lib/api";
import { Card, UploadBtn, Badge, C } from "@/components/ui";
import HomeMediaGrid from "@/components/HomeMediaGrid";
import AdminHint from "@/components/AdminHint";
import { Check, ChevronLeft, ChevronRight, Trash2, ImageIcon, Video, Sparkles } from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-10">
      <MediaGridEditor />
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
                    <video src={getFileUrl(item.src)} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFileUrl(item.src)} alt="" className="w-full h-full object-cover" />
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
// Moved to its own page — see app/admin/brands/page.tsx — so it isn't
// managed from inside the Home Page settings anymore.