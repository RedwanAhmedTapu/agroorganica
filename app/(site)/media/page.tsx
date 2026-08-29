"use client";

import { useAppData } from "@/lib/DataContext";
import { ImageStrip, C } from "@/components/ui";

export default function MediaPage() {
  const { data } = useAppData();
  const sections = data.media.sections;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-10">
      {sections.length === 0 && (
        <p className="text-sm" style={{ color: C.muted }}>
          No media galleries yet.
        </p>
      )}
      {sections.map((s) => (
        <div key={s.id}>
          <h3 className="font-serif text-2xl mb-4" style={{ color: C.text }}>
            {s.title}
          </h3>
          {s.images.length === 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>
              No images in this gallery yet.
            </p>
          ) : (
            <ImageStrip images={s.images} />
          )}
        </div>
      ))}
    </div>
  );
}
