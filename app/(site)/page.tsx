"use client";

import Link from "next/link";
import { useAppData } from "@/lib/DataContext";
import HomeMediaGrid from "@/components/HomeMediaGrid";
import BrandSlider from "@/components/BrandSlider";
import { C } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const { data, ready } = useAppData();

  if (!ready) {
    return <div className="max-w-6xl mx-auto px-4 py-24 text-center text-sm" style={{ color: C.muted }}>Loading…</div>;
  }

  return (
    <div>
    

          {/* Media grid section */}
      <section >
        
        <div className="px-4">
          <HomeMediaGrid templateId={data.home.grid.templateId} items={data.home.grid.items} />
        </div>
      </section>

      {/* Brand slider section */}
      <section className="py-12" style={{ backgroundColor: C.cream, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 text-center mb-2">
          <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: C.gold }}>
            Trusted Names
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl" style={{ color: C.text }}>
            Our Brands
          </h2>
        </div>
        <BrandSlider brands={data.home.brands} />
      </section>
    </div>
  );
}
