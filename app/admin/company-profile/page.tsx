"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { TwoPane, Card, Btn, inputCls, inputStyle, C } from "@/components/ui";
import { ProfileAchievementEditor } from "@/components/ProfileAchievementEditor";
import AdminHint from "@/components/AdminHint";
import { uid } from "@/lib/helpers";
import { Plus, Trash2 } from "lucide-react";
import { CompanyProfileTab } from "@/lib/types";

export default function AdminCompanyProfilePage() {
  const { data, setData } = useAppData();
  const tabs = data.companyProfile.tabs;
  const [activeId, setActiveId] = useState<string | null>(tabs[0]?.id ?? null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "profile" | "achievement">("text");
  const tab = tabs.find((t) => t.id === activeId);

  const update = (fn: (tabs: CompanyProfileTab[]) => CompanyProfileTab[]) =>
    setData((d) => ({ ...d, companyProfile: { tabs: fn(d.companyProfile.tabs) } }));

  const addTab = () => {
    if (!newName.trim()) return;
    const base = { id: uid(), name: newName.trim() };
    const t: CompanyProfileTab =
      newType === "text"
        ? { ...base, type: "text", content: "" }
        : newType === "profile"
        ? { ...base, type: "profile", items: [] }
        : { ...base, type: "achievement", items: [] };
    update((tabs) => [...tabs, t]);
    setActiveId(t.id);
    setNewName("");
  };

  const deleteTab = (id: string) => {
    update((tabs) => tabs.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const renameTab = (id: string, name: string) => update((tabs) => tabs.map((t) => (t.id === id ? { ...t, name } : t)));
  const setContent = (id: string, content: string) =>
    update((tabs) => tabs.map((t) => (t.id === id && t.type === "text" ? { ...t, content } : t)));

  const addItem = (id: string, item: any) =>
    update((tabs) => tabs.map((t) => (t.id === id && "items" in t ? ({ ...t, items: [...t.items, item] } as CompanyProfileTab) : t)));
  const deleteItem = (id: string, itemId: string) =>
    update((tabs) =>
      tabs.map((t) => (t.id === id && "items" in t ? ({ ...t, items: t.items.filter((i: any) => i.id !== itemId) } as CompanyProfileTab) : t))
    );

  return (
    <>
      <AdminHint>
        Create one tab per section of your Company Profile page. <strong>Text</strong> tabs are for
        long-form writing (About Us, History, etc). <strong>Profile</strong> tabs list people with a
        photo, name and designation (Board of Directors, KMP). <strong>Achievement</strong> tabs
        list a photo + title (awards, milestones). Click a tab on the left to edit it.
      </AdminHint>
      <TwoPane
      left={
        <>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="text-left px-3 py-2 rounded-md text-sm flex items-center justify-between"
              style={{ backgroundColor: activeId === t.id ? C.primaryTint : "#fff", border: `1px solid ${C.border}`, color: C.text }}
            >
              <span>{t.name}</span>
              <span className="text-[10px] uppercase font-semibold" style={{ color: C.muted }}>
                {t.type}
              </span>
            </button>
          ))}
          <Card className="p-3 mt-2">
            <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>
              Add tab
            </div>
            <input
              placeholder="Tab name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={`${inputCls} mb-2`}
              style={inputStyle}
            />
            <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className={`${inputCls} mb-2`} style={inputStyle}>
              <option value="text">Text (docs)</option>
              <option value="profile">Profile (photo, name, designation)</option>
              <option value="achievement">Achievement (photo, title)</option>
            </select>
            <Btn size="sm" onClick={addTab}>
              <Plus size={14} /> Add tab
            </Btn>
          </Card>
        </>
      }
      right={
        !tab ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Select or add a tab.
          </p>
        ) : (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <input
                value={tab.name}
                onChange={(e) => renameTab(tab.id, e.target.value)}
                className="font-serif text-xl bg-transparent outline-none"
                style={{ color: C.primary, border: "none" }}
              />
              <button onClick={() => deleteTab(tab.id)} className="text-xs flex items-center gap-1" style={{ color: C.danger }}>
                <Trash2 size={14} /> Delete tab
              </button>
            </div>

            {tab.type === "text" && (
              <textarea
                rows={10}
                value={tab.content}
                onChange={(e) => setContent(tab.id, e.target.value)}
                className={inputCls}
                style={inputStyle}
                placeholder="Write the About Us content here…"
              />
            )}

            {(tab.type === "profile" || tab.type === "achievement") && (
              <ProfileAchievementEditor tab={tab} onAdd={(item) => addItem(tab.id, item)} onDelete={(itemId) => deleteItem(tab.id, itemId)} />
            )}
          </Card>
        )
      }
    />
    </>
  );
}
