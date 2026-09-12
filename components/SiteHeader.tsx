"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Leaf, ChevronDown, ExternalLink } from "lucide-react";
import { C } from "./ui";
import { useAppData } from "@/lib/DataContext";
import { getFileUrl } from "@/lib/api";

type SubItem = { id: string; label: string; href: string };
type NavItem = { key: string; label: string; href: string; children?: SubItem[] };

// Fixed-size round badge (logo or leaf icon) + separately editable company
// name/subtitle text — all three come from the admin panel, all fixed in
// size so the header height/layout never shifts between devices.
function BrandMark({ logoUrl, companyName, companySubtitle }: { logoUrl?: string; companyName?: string; companySubtitle?: string }) {
  return (
    <>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#fff" }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getFileUrl(logoUrl)} alt={companyName || "Logo"} className="w-full h-full object-contain p-1" />
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

// Desktop nav button: the label itself is a normal link (click -> navigates
// straight to that page). When the item has sub-items, a small chevron next
// to the label opens a dropdown "selection" of that page's own content —
// clicking any option there navigates to that specific tab/category/section.
function DesktopNavButton({ item, active, openKey, setOpenKey }: { item: NavItem; active: boolean; openKey: string | null; setOpenKey: (k: string | null) => void }) {
  const isOpen = openKey === item.key;
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <div className="relative h-full">
      <div
        className="h-16 flex items-center"
        style={{ backgroundColor: active ? C.primarySoft : "transparent" }}
      >
        <Link
          href={item.href}
          onClick={() => setOpenKey(null)}
          className="h-full pl-4 flex items-center text-xs font-semibold uppercase tracking-wide text-white"
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={`${item.label} submenu`}
            onClick={() => setOpenKey(isOpen ? null : item.key)}
            className="h-full pl-1.5 pr-4 flex items-center text-white"
          >
            <ChevronDown size={14} className="transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div
          className="absolute left-0 top-16 min-w-[220px] rounded-b-md overflow-hidden shadow-lg z-30"
          style={{ backgroundColor: "#fff", border: `1px solid ${C.border}` }}
        >
          {item.children!.map((sub) => (
            <Link
              key={sub.id}
              href={sub.href}
              onClick={() => setOpenKey(null)}
              className="block px-4 py-2.5 text-sm hover:bg-black/5 transition-colors"
              style={{ color: C.text }}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile accordion version of the same nav item.
function MobileNavItem({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center rounded" style={{ backgroundColor: active ? C.primarySoft : "transparent" }}>
        <Link href={item.href} onClick={onNavigate} className="flex-1 text-left text-sm py-2 px-2 text-white">
          {item.label}
        </Link>
        {hasChildren && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 py-2 text-white" aria-label={`${item.label} submenu`}>
            <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="flex flex-col pl-4 mt-0.5 mb-1">
          {item.children!.map((sub) => (
            <Link
              key={sub.id}
              href={sub.href}
              onClick={onNavigate}
              className="text-left text-xs py-1.5 px-2 rounded"
              style={{ color: "#dfeee3" }}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { data, ready } = useAppData();
  const navRef = useRef<HTMLDivElement>(null);

  // Build the navbar straight from the same content the pages themselves
  // render, so "Company Profile ▾" / "Brands & Products ▾" / "Investor
  // Relation ▾" / "Media ▾" always show whatever tabs/categories/items/
  // galleries currently exist — add one in the admin panel and it shows up
  // here automatically, and picking it takes you to that exact content.
  const navItems: NavItem[] = [
    { key: "home", label: "Home", href: "/" },
    {
      key: "company-profile",
      label: "Company Profile",
      href: "/company-profile",
      children: data.companyProfile.tabs.map((t) => ({ id: t.id, label: t.name, href: `/company-profile?tab=${t.id}` })),
    },
    {
      key: "brands-products",
      label: "Products",
      href: "/brands-products",
      children: data.brandsProducts.categories.map((c) => ({ id: c.id, label: c.name, href: `/brands-products?cat=${c.id}` })),
    },
    {
      key: "investor-relation",
      label: "Investor Relation",
      href: "/investor-relation",
      children: data.investorRelation.items.map((i) => ({ id: i.id, label: i.name, href: `/investor-relation?item=${i.id}` })),
    },
    {
      key: "media",
      label: "Media",
      href: "/media",
      children: data.media.sections.map((s) => ({ id: s.id, label: s.title, href: `/media#${s.id}` })),
    },
    { key: "contact", label: "Contact", href: "/contact" },
  ];

  const onlineShopUrl = data.siteSettings?.onlineShopUrl?.trim();
  const onlineShopLabel = data.siteSettings?.onlineShopLabel?.trim() || "Online Shop";
  const isExternalShop = !!onlineShopUrl && /^https?:\/\//i.test(onlineShopUrl);

  // Close an open dropdown when clicking anywhere outside the nav.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenKey(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Same reasoning as the footer: don't flash the placeholder/seed
  // company name and nav items before swapping to the real ones a moment
  // later — show a plain skeleton bar (same height, so nothing shifts)
  // until the real content has loaded.
  if (!ready) {
    return (
      <div style={{ backgroundColor: C.primary }}>
        <div className="h-1" style={{ backgroundColor: C.gold }} />
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
            <div className="flex flex-col gap-1.5">
              <div className="rounded animate-pulse" style={{ width: 110, height: 12, backgroundColor: "rgba(255,255,255,0.15)" }} />
              <div className="rounded animate-pulse" style={{ width: 70, height: 8, backgroundColor: "rgba(255,255,255,0.15)" }} />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {[70, 100, 90, 70, 60].map((w, i) => (
              <div key={i} className="rounded animate-pulse" style={{ width: w, height: 10, backgroundColor: "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

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

        <nav ref={navRef} className="hidden md:flex items-center h-full">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return <DesktopNavButton key={item.key} item={item} active={!!active} openKey={openKey} setOpenKey={setOpenKey} />;
          })}

          {onlineShopUrl && (
            <a
              href={onlineShopUrl}
              target={isExternalShop ? "_blank" : undefined}
              rel={isExternalShop ? "noopener noreferrer" : undefined}
              className="ml-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-md transition-colors"
              style={{ backgroundColor: C.gold, color: "#2a2213" }}
            >
              {onlineShopLabel} {isExternalShop && <ExternalLink size={12} />}
            </a>
          )}
        </nav>

        <button className="md:hidden text-white" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <MobileNavItem key={item.key} item={item} active={!!active} onNavigate={() => setMobileOpen(false)} />
            );
          })}

          {onlineShopUrl && (
            <a
              href={onlineShopUrl}
              target={isExternalShop ? "_blank" : undefined}
              rel={isExternalShop ? "noopener noreferrer" : undefined}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wide px-4 py-2.5 rounded-md"
              style={{ backgroundColor: C.gold, color: "#2a2213" }}
            >
              {onlineShopLabel} {isExternalShop && <ExternalLink size={12} />}
            </a>
          )}
        </div>
      )}
    </div>
  );
}