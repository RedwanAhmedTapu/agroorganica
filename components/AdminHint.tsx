import { Info } from "lucide-react";
import { C } from "./ui";

// A small, consistent "how to use this page" callout, dropped at the top of
// admin sections so a non-technical admin always knows what to do next.
export default function AdminHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 text-xs rounded-md px-3 py-2.5 mb-4"
      style={{ backgroundColor: C.primaryTint, color: C.text, border: `1px solid ${C.border}` }}
    >
      <Info size={14} className="mt-0.5 shrink-0" style={{ color: C.primary }} />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
