"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { TwoPane, Card, Btn, UploadBtn, inputCls, inputStyle, C } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { uid } from "@/lib/helpers";
import { Plus, Trash2, CheckSquare, Square, X } from "lucide-react";
import { MediaSection } from "@/lib/types";
import { bulkDeleteUploads } from "@/lib/api";

export default function AdminMediaPage() {
  const { data, setData } = useAppData();
  const sections = data.media.sections;
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  const [newTitle, setNewTitle] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const section = sections.find((s) => s.id === activeId);

  const update = (fn: (ss: MediaSection[]) => MediaSection[]) => setData((d) => ({ ...d, media: { sections: fn(d.media.sections) } }));

  const addSection = () => {
    if (!newTitle.trim()) return;
    const s: MediaSection = { id: uid(), title: newTitle.trim(), images: [] };
    update((ss) => [...ss, s]);
    setActiveId(s.id);
    setNewTitle("");
  };
  const deleteSection = (id: string) => {
    update((ss) => ss.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const addImages = (files: { name: string; dataUrl: string }[]) => {
    if (!section) return;
    update((ss) => ss.map((s) => (s.id === section.id ? { ...s, images: [...s.images, ...files.map((f) => f.dataUrl)] } : s)));
  };
  const deleteImage = (idx: number) => {
    if (!section) return;
    const url = section.images[idx];
    update((ss) => ss.map((s) => (s.id === section.id ? { ...s, images: s.images.filter((_, i) => i !== idx) } : s)));
    if (url?.startsWith("/uploads/")) bulkDeleteUploads([url]).catch(() => {});
  };

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelected(new Set());
  };
  const toggleSelected = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };
  const deleteSelected = async () => {
    if (!section || selected.size === 0) return;
    const urlsToDelete = section.images.filter((_, i) => selected.has(i));
    update((ss) => ss.map((s) => (s.id === section.id ? { ...s, images: s.images.filter((_, i) => !selected.has(i)) } : s)));
    const realUrls = urlsToDelete.filter((u) => u.startsWith("/uploads/"));
    if (realUrls.length) await bulkDeleteUploads(realUrls).catch(() => {});
    setSelected(new Set());
    setSelectMode(false);
  };

  return (
    <>
      <AdminHint>
        Each "gallery" is one event/album shown on the public Media page. Add a gallery, then
        upload photos into it. Use "Select multiple" inside a gallery to bulk-delete photos.
      </AdminHint>
      <TwoPane
      left={
        <>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveId(s.id);
                setSelectMode(false);
                setSelected(new Set());
              }}
              className="text-left px-3 py-2 rounded-md text-sm"
              style={{ backgroundColor: activeId === s.id ? C.primaryTint : "#fff", border: `1px solid ${C.border}`, color: C.text }}
            >
              {s.title} <span style={{ color: C.muted }}>({s.images.length})</span>
            </button>
          ))}
          <Card className="p-3 mt-2">
            <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>
              Add gallery
            </div>
            <input
              placeholder="Gallery title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={`${inputCls} mb-2`}
              style={inputStyle}
            />
            <Btn size="sm" onClick={addSection}>
              <Plus size={14} /> Add gallery
            </Btn>
          </Card>
        </>
      }
      right={
        !section ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Select or add a gallery.
          </p>
        ) : (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h3 className="font-serif text-xl" style={{ color: C.primary }}>
                {section.title}
              </h3>
              <div className="flex items-center gap-3">
                {section.images.length > 0 && !selectMode && (
                  <button onClick={toggleSelectMode} className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                    <CheckSquare size={14} /> Select multiple
                  </button>
                )}
                {selectMode && (
                  <>
                    <span className="text-xs" style={{ color: C.muted }}>
                      {selected.size} selected
                    </span>
                    <Btn size="sm" variant="danger" onClick={deleteSelected} disabled={selected.size === 0}>
                      <Trash2 size={13} /> Delete selected
                    </Btn>
                    <button onClick={toggleSelectMode} className="text-xs flex items-center gap-1" style={{ color: C.muted }}>
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}
                <button onClick={() => deleteSection(section.id)} className="text-xs flex items-center gap-1" style={{ color: C.danger }}>
                  <Trash2 size={14} /> Delete gallery
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {section.images.map((img, i) => (
                <div
                  key={i}
                  className="relative rounded-md overflow-hidden cursor-pointer"
                  style={{ border: `1px solid ${selectMode && selected.has(i) ? C.primary : C.border}` }}
                  onClick={() => selectMode && toggleSelected(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} className="w-full aspect-square object-cover" alt="" />
                  {selectMode ? (
                    <div
                      className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center"
                      style={{ backgroundColor: selected.has(i) ? C.primary : "rgba(255,255,255,0.85)" }}
                    >
                      {selected.has(i) ? <CheckSquare size={12} color="#fff" /> : <Square size={12} color={C.muted} />}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(i);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "rgba(179,70,44,0.9)" }}
                    >
                      <Trash2 size={10} color="#fff" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <UploadBtn multiple usage="media-gallery" label="Upload image(s)" onFiles={addImages} />
          </Card>
        )
      }
    />
    </>
  );
}
