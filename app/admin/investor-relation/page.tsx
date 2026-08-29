"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { TwoPane, Card, Btn, UploadBtn, AdminListRow, inputCls, inputStyle, C } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { uid } from "@/lib/helpers";
import { Plus, Trash2, FileText } from "lucide-react";
import { InvestorItem } from "@/lib/types";
import { bulkDeleteUploads } from "@/lib/api";

export default function AdminInvestorPage() {
  const { data, setData } = useAppData();
  const items = data.investorRelation.items;
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [newItem, setNewItem] = useState("");
  const item = items.find((i) => i.id === activeId);

  const update = (fn: (its: InvestorItem[]) => InvestorItem[]) => setData((d) => ({ ...d, investorRelation: { items: fn(d.investorRelation.items) } }));

  const addItem = () => {
    if (!newItem.trim()) return;
    const it: InvestorItem = { id: uid(), name: newItem.trim(), pdfs: [] };
    update((its) => [...its, it]);
    setActiveId(it.id);
    setNewItem("");
  };
  const deleteItemRow = (id: string) => {
    update((its) => its.filter((i) => i.id !== id));
    if (activeId === id) setActiveId(null);
  };
  const addPdfs = (files: { name: string; dataUrl: string }[]) => {
    if (!item) return;
    update((its) => its.map((i) => (i.id === item.id ? { ...i, pdfs: [...i.pdfs, ...files.map((f) => ({ id: uid(), ...f }))] } : i)));
  };
  const deletePdf = (pdfId: string) => {
    if (!item) return;
    const removed = item.pdfs.find((p) => p.id === pdfId);
    update((its) => its.map((i) => (i.id === item.id ? { ...i, pdfs: i.pdfs.filter((p) => p.id !== pdfId) } : i)));
    if (removed?.dataUrl?.startsWith("/uploads/")) bulkDeleteUploads([removed.dataUrl]).catch(() => {});
  };

  return (
    <>
      <AdminHint>
        Add a category (e.g. "Annual Report", "Financial Statements"), then upload PDF files into
        it. Visitors will see these listed with a document icon and can click to open/download them.
      </AdminHint>
      <TwoPane
      left={
        <>
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => setActiveId(i.id)}
              className="text-left px-3 py-2 rounded-md text-sm"
              style={{ backgroundColor: activeId === i.id ? C.primaryTint : "#fff", border: `1px solid ${C.border}`, color: C.text }}
            >
              {i.name} <span style={{ color: C.muted }}>({i.pdfs.length})</span>
            </button>
          ))}
          <Card className="p-3 mt-2">
            <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>
              Add category
            </div>
            <input
              placeholder="e.g. Quarterly Report"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className={`${inputCls} mb-2`}
              style={inputStyle}
            />
            <Btn size="sm" onClick={addItem}>
              <Plus size={14} /> Add
            </Btn>
          </Card>
        </>
      }
      right={
        !item ? (
          <p className="text-sm" style={{ color: C.muted }}>
            Select or add a category.
          </p>
        ) : (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl" style={{ color: C.primary }}>
                {item.name}
              </h3>
              <button onClick={() => deleteItemRow(item.id)} className="text-xs flex items-center gap-1" style={{ color: C.danger }}>
                <Trash2 size={14} /> Delete category
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {item.pdfs.map((pdf) => (
                <AdminListRow key={pdf.id} onDelete={() => deletePdf(pdf.id)}>
                  <div className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                    <FileText size={15} style={{ color: C.danger }} /> <span className="truncate">{pdf.name}</span>
                  </div>
                </AdminListRow>
              ))}
              {item.pdfs.length === 0 && (
                <p className="text-sm" style={{ color: C.muted }}>
                  No PDFs yet.
                </p>
              )}
            </div>
            <UploadBtn accept="application/pdf" multiple label="Upload PDF(s)" onFiles={addPdfs} />
          </Card>
        )
      }
    />
    </>
  );
}
