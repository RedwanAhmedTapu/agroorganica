"use client";

import { Brand } from "@/lib/types";
import { C } from "./ui";

export default function BrandSlider({ brands }: { brands: Brand[] }) {
  const active = brands.filter((b) => b.active && b.image);

  if (active.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: C.muted }}>
        No active brands to show yet.
      </p>
    );
  }

  // Duplicate the list so the CSS marquee can loop seamlessly.
  const loop = [...active, ...active];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 md:w-16 z-10" style={{ background: `linear-gradient(to right, ${C.cream}, transparent)` }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 md:w-16 z-10" style={{ background: `linear-gradient(to left, ${C.cream}, transparent)` }} />
      <div className="flex items-center gap-4 sm:gap-8 md:gap-12 w-max animate-brand-scroll">
        {loop.map((b, i) => (
          <div
            key={`${b.id}-${i}`}
            className="shrink-0 h-14 w-20 sm:h-16 sm:w-36 md:h-20 md:w-64 flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image} alt={b.name} title={b.name} className="max-h-9 sm:max-h-11 md:max-h-14 max-w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
