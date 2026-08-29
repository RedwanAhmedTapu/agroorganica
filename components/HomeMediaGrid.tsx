"use client";

import { HomeGridItem } from "@/lib/types";
import { getTemplate } from "@/lib/homeTemplates";
import { C } from "./ui";

export default function HomeMediaGrid({
  templateId,
  items,
}: {
  templateId: string;
  items: HomeGridItem[];
}) {
  const tpl = getTemplate(templateId);
  const filled = items.filter((it) => it.src);

  if (filled.length === 0) {
    return (
      <div
        className="rounded-xl flex items-center justify-center text-sm py-16"
        style={{
          border: `1px dashed ${C.border}`,
          color: C.muted,
          backgroundColor: "#fff",
        }}
      >
        No media added yet — add images or videos from the admin panel.
      </div>
    );
  }

  return (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${tpl.cols}, 1fr)`,
        gridAutoRows: "clamp(140px, 24vw, 340px)",
        gridAutoFlow: "dense",
      }}
    >
      {filled.slice(0, tpl.cells.length).map((item, i) => {
        const cell = tpl.cells[i] ?? { colSpan: 1, rowSpan: 1 };
        return (
          <div
            key={item.id}
            className="relative rounded-xl overflow-hidden group"
            style={{
              gridColumn: `span ${cell.colSpan}`,
              gridRow: `span ${cell.rowSpan}`,
              border: `1px solid ${C.border}`,
              backgroundColor: "#000",
            }}
          >
            {item.type === "video" ? (
              <video
                src={item.src}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: "inset 0 0 0 2px rgba(201,154,62,0.6)" }}
            />
          </div>
        );
      })}
    </div>
  );
}
