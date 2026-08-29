"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Settings, Leaf } from "lucide-react";
import { C } from "./ui";
import { useAppData } from "@/lib/DataContext";

const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/company-profile", label: "Company Profile" },
  { href: "/brands-products", label: "Brands & Products" },
  { href: "/investor-relation", label: "Investor Relation" },
  { href: "/media", label: "Media" },
  { href: "/contact", label: "Contact" },
];

// Fixed-size round badge (logo or leaf icon) + separately editable company
// name/subtitle text — all three come from the admin panel, all fixed in
// size so the header height/layout never shifts between devices.
function BrandMark({ logoUrl, companyName, companySubtitle }: { logoUrl?: string; companyName?: string; companySubtitle?: string }) {
  return (
    <>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#fff" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={companyName || "Logo"} className="w-full h-full object-contain p-1" />
        ) : (
          <Leaf size={18} style={{ color: C.primary }} />
        )}
      </div>
      <div className="leading-tight">
        <div className="text-white font-serif font-semibold text-sm tracking-wide">{companyName || "Agro Organica"}</div>
        <div className="text-[10px] uppercase tracking-widest" style={{ color: "#bcd2c4" }}>
          {companySubtitle || "Nurture Nature"}
        </div>
      </div>
    </>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useAppData();

  return (
    <div style={{ backgroundColor: C.primary }}>
      <div className="h-1" style={{ backgroundColor: C.gold }} />
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark
            logoUrl={data.siteSettings?.logoUrl}
            companyName={data.siteSettings?.companyName}
            companySubtitle={data.siteSettings?.companySubtitle}
          />
        </Link>

        <nav className="hidden md:flex items-center h-full">
          {MAIN_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="h-16 px-4 flex items-center text-xs font-semibold uppercase tracking-wide transition-colors"
                style={{ backgroundColor: active ? C.primarySoft : "transparent", color: "#fff" }}
              >
                {item.label}
              </Link>
            );
          })}
         
        </nav>

        <button className="md:hidden text-white" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
          {MAIN_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-left text-sm py-2 px-2 rounded"
                style={{ backgroundColor: active ? C.primarySoft : "transparent", color: "#fff" }}
              >
                {item.label}
              </Link>
            );
          })}
         
        </div>
      )}
    </div>
  );
}
