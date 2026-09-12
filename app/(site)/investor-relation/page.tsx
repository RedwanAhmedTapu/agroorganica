"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/DataContext";
import { SecondaryNav } from "@/components/SecondaryNav";
import { C } from "@/components/ui";
import { FileText } from "lucide-react";
import { getFileUrl } from "@/lib/api";

export default function InvestorRelationPage() {
  return (
    <Suspense fallback={null}>
      <InvestorRelationContent />
    </Suspense>
  );
}

function InvestorRelationContent() {
  const { data } = useAppData();
  const items = data.investorRelation.items;
  const searchParams = useSearchParams();
  const requestedItem = searchParams.get("item");
  const [activeId, setActiveId] = useState<string | undefined>(requestedItem || items[0]?.id);

  // Keep in sync with the navbar dropdown — picking an item there links to
  // /investor-relation?item=<id> and should land straight on it.
  useEffect(() => {
    if (requestedItem && items.some((i) => i.id === requestedItem)) {
      setActiveId(requestedItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedItem]);

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
                    href={getFileUrl(pdf.dataUrl)}
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