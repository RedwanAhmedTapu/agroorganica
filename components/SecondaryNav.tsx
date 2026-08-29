"use client";

import { C } from "./ui";

export function SecondaryNav<T extends { id: string; name: string }>({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: T[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
}) {
  if (!tabs.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm" style={{ color: C.muted }}>
        Nothing published here yet — add items from the admin panel.
      </div>
    );
  }
  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: "#fff" }}>
      <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="py-3.5 text-sm whitespace-nowrap font-medium border-b-2 transition-colors"
              style={{ borderColor: active ? C.primary : "transparent", color: active ? C.primary : C.muted }}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
