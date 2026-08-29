"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { SecondaryNav } from "@/components/SecondaryNav";
import { Card, C } from "@/components/ui";

export default function CompanyProfilePage() {
  const { data } = useAppData();
  const tabs = data.companyProfile.tabs;
  const [activeId, setActiveId] = useState<string | undefined>(tabs[0]?.id);
  const tab = tabs.find((t) => t.id === activeId) || tabs[0];

  return (
    <div>
      <SecondaryNav tabs={tabs} activeId={tab?.id} onSelect={setActiveId} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {!tab && null}

        {tab?.type === "text" && (
          <div>
            <h2 className="font-serif text-3xl mb-5" style={{ color: C.text }}>
              {tab.name}
            </h2>
            {tab.content.split("\n\n").map((p, i) => (
              <p key={i} className="text-sm leading-7 mb-4" style={{ color: C.text }}>
                {p}
              </p>
            ))}
          </div>
        )}

        {tab?.type === "profile" && (
          <div>
            <h2 className="font-serif text-3xl mb-6" style={{ color: C.text }}>
              {tab.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {tab.items.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                  <div className="p-3 text-center">
                    <div className="text-sm font-semibold" style={{ color: C.primary }}>
                      {p.name}
                    </div>
                    <div className="text-xs" style={{ color: C.muted }}>
                      {p.designation}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab?.type === "achievement" && (
          <div>
            <h2 className="font-serif text-3xl mb-6" style={{ color: C.text }}>
              {tab.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {tab.items.map((a) => (
                <Card key={a.id} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt={a.title} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-3">
                    <div className="text-sm font-medium" style={{ color: C.text }}>
                      {a.title}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
