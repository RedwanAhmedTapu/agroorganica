"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { UploadBtn, Btn, inputCls, inputStyle, C } from "./ui";
import { uid } from "@/lib/helpers";
import { CompanyProfileTab, ProfileItem, AchievementItem } from "@/lib/types";

export function ProfileAchievementEditor({
  tab,
  onAdd,
  onDelete,
}: {
  tab: Extract<CompanyProfileTab, { type: "profile" | "achievement" }>;
  onAdd: (item: ProfileItem | AchievementItem) => void;
  onDelete: (itemId: string) => void;
}) {
  const isProfile = tab.type === "profile";
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim() || !image) return;
    onAdd(
      isProfile
        ? ({ id: uid(), name, designation, image } as ProfileItem)
        : ({ id: uid(), title: name, image } as AchievementItem)
    );
    setName("");
    setDesignation("");
    setImage(null);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        {tab.items.map((it: any) => (
          <div key={it.id} className="rounded-lg overflow-hidden relative" style={{ border: `1px solid ${C.border}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image} className="w-full aspect-square object-cover" alt="" />
            <div className="p-2">
              <div className="text-xs font-semibold truncate" style={{ color: C.text }}>
                {isProfile ? it.name : it.title}
              </div>
              {isProfile && (
                <div className="text-[11px] truncate" style={{ color: C.muted }}>
                  {it.designation}
                </div>
              )}
            </div>
            <button
              onClick={() => onDelete(it.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(179,70,44,0.9)" }}
            >
              <Trash2 size={12} color="#fff" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-md" style={{ backgroundColor: C.cream, border: `1px dashed ${C.border}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.muted }}>
          Add {isProfile ? "person" : "achievement"}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            placeholder={isProfile ? "Name" : "Title"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
          {isProfile && (
            <input
              placeholder="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <UploadBtn
            small
            usage={isProfile ? "profile" : "achievement"}
            label={image ? "Change photo" : "Upload photo"}
            onFiles={(f) => setImage(f[0]?.dataUrl)}
          />
          {image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} className="w-9 h-9 rounded object-cover" alt="" />
          )}
          <Btn size="sm" onClick={submit}>
            <Plus size={14} /> Add
          </Btn>
        </div>
      </div>
    </div>
  );
}
