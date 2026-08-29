"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { SecondaryNav } from "@/components/SecondaryNav";
import { C } from "@/components/ui";
import { FileText } from "lucide-react";

export default function InvestorRelationPage() {
  const { data } = useAppData();
  const items = data.investorRelation.items;
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const item = items.find((i) => i.id === activeId) || items[0];

  return (
    <div>
      <SecondaryNav tabs={items} activeId={item?.id} onSelect={setActiveId} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {item && (
          <>
            <h2 className="font-serif text-3xl mb-6" style={{ color: C.text }}>
              {item.name}
            </h2>
            {item.pdfs.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>
                No documents uploaded yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-w-xl">
                {item.pdfs.map((pdf) => (
                  <a
                    key={pdf.id}
                    href={pdf.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-md"
                    style={{ border: `1px solid ${C.border}`, backgroundColor: "#fff" }}
                  >
                    <FileText size={18} style={{ color: C.danger }} />
                    <span className="text-sm flex-1" style={{ color: C.text }}>
                      {pdf.name}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: C.primary }}>
                      View
                    </span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
