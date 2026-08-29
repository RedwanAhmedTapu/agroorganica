"use client";

import { useState } from "react";
import { useAppData } from "@/lib/DataContext";
import { SecondaryNav } from "@/components/SecondaryNav";
import { C } from "@/components/ui";

export default function BrandsProductsPage() {
  const { data } = useAppData();
  const cats = data.brandsProducts.categories;
  const [activeId, setActiveId] = useState<string | undefined>(cats[0]?.id);
  const cat = cats.find((c) => c.id === activeId) || cats[0];

  return (
    <div>
      <SecondaryNav tabs={cats} activeId={cat?.id} onSelect={setActiveId} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {cat && (
          <>
            <h2 className="font-serif text-3xl mb-6" style={{ color: C.text }}>
              {cat.name}
            </h2>
            {cat.products.length === 0 ? (
              <p className="text-sm" style={{ color: C.muted }}>
                No products in this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {cat.products.map((p) => (
                  <div key={p.id} className="text-center">
                    <div className="rounded-lg overflow-hidden mb-3" style={{ border: `1px solid ${C.border}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />
                    </div>
                    <div className="text-sm font-medium" style={{ color: C.text }}>
                      {p.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
