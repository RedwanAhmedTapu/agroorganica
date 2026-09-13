"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Leaf, ChevronDown, ExternalLink } from "lucide-react";
import { C } from "./ui";
import { useAppData } from "@/lib/DataContext";
import { getFileUrl } from "@/lib/api";
import { ProductNode } from "@/lib/types";

// SubItem is now recursive so any depth of nesting the admin creates
// (Category -> Sub -> Sub -> ...) can be represented and rendered here.
type SubItem = { id: string; label: string; href: string; children?: SubItem[] };
type NavItem = { key: string; label: string; href: string; children?: SubItem[] };

// Max height (px) before a submenu level starts scrolling instead of
// growing forever. Tune this if you want more/fewer visible rows.
const SUBMENU_MAX_HEIGHT = 320;

// Turns the admin's nested product tree into the recursive SubItem shape,
// building a `?cat=<rootId>&path=<id1,id2,...>` href for every node so the
// products page can jump straight to that exact nested node.
function buildProductSubItems(nodes: ProductNode[], rootId: string, parentPath: string[] = []): SubItem[] {
  return nodes.map((n) => {
    const path = [...parentPath, n.id];
    const children = n.children.length ? buildProductSubItems(n.children, rootId, path) : undefined;
    return {
      id: n.id,
      label: n.name,
      href: `/brands-products?cat=${rootId}&path=${path.join(",")}`,
      children,
    };
  });
}

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

// Recursive desktop flyout: renders one level of items in a scrollable
// panel, and on hover opens the next level to the right (like a real
// nested-category menu). Works for any depth the admin has created.
function DesktopSubmenu({ items, onNavigate }: { items: SubItem[]; onNavigate: () => void }) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <div
      className="min-w-[220px] rounded-b-md overflow-y-auto shadow-lg"
      style={{ backgroundColor: "#fff", border: `1px solid ${C.border}`, maxHeight: SUBMENU_MAX_HEIGHT }}
    >
      {items.map((item) => {
        const hasChildren = !!item.children && item.children.length > 0;
        const isHovered = hoverId === item.id;
        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => hasChildren && setHoverId(item.id)}
            onMouseLeave={() => hasChildren && setHoverId((v) => (v === item.id ? null : v))}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors"
              style={{ color: C.text }}
            >
              <span className="truncate">{item.label}</span>
              {hasChildren && <ChevronDown size={12} className="shrink-0" style={{ transform: "rotate(-90deg)", color: C.muted }} />}
            </Link>
            {hasChildren && isHovered && (
              <div className="absolute left-full top-0 z-40 -ml-px">
                <DesktopSubmenu items={item.children!} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Desktop nav button: the label itself is a normal link (click -> navigates
// straight to that page). When the item has sub-items, simply HOVERING
// anywhere over the item (label, chevron, or the surrounding cell) opens
// its dropdown — no click required. The chevron is now a pure visual
// indicator, not an interactive control.
//
// Hovering into the dropdown itself doesn't close it, because the dropdown
// is rendered as a DOM descendant of this same wrapper div, so the pointer
// moving into it is not treated as "leaving" the wrapper.
//
// No background highlight here — active/hover state is communicated
// entirely by the sliding underline rendered by the parent <nav>. This
// component just needs to (a) expose its DOM node via `registerRef` so the
// parent can measure it, and (b) report hover in/out via `onHoverChange`.
function DesktopNavButton({
  item,
  active,
  openKey,
  setOpenKey,
  registerRef,
  onHoverChange,
}: {
  item: NavItem;
  active: boolean;
  openKey: string | null;
  setOpenKey: (k: string | null | ((prev: string | null) => string | null)) => void;
  registerRef: (key: string, el: HTMLDivElement | null) => void;
  onHoverChange: (key: string | null) => void;
}) {
  const isOpen = openKey === item.key;
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <div
      className="relative h-full"
      ref={(el) => registerRef(item.key, el)}
      onMouseEnter={() => {
        onHoverChange(item.key);
        if (hasChildren) setOpenKey(item.key);
      }}
      onMouseLeave={() => {
        onHoverChange(null);
        // Only close if this item is the one currently open, so a fast
        // mouse move between adjacent items can't accidentally close
        // whichever one the pointer just entered.
        setOpenKey((prev) => (prev === item.key ? null : prev));
      }}
    >
      <div className="h-16 flex items-center">
        <Link
          href={item.href}
          onClick={() => setOpenKey(null)}
          className="h-full pl-3 flex items-center text-xs font-semibold uppercase tracking-wide transition-colors duration-200"
          style={{ color: active ? "#fff" : "#cfe3d5" }}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <span
            aria-hidden="true"
            className="h-full pl-1 pr-3 flex items-center transition-colors duration-200"
            style={{ color: active ? "#fff" : "#cfe3d5" }}
          >
            <ChevronDown
              size={14}
              className="transition-transform duration-200"
              style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
            />
          </span>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="absolute left-0 top-16 z-30">
          <DesktopSubmenu items={item.children!} onNavigate={() => setOpenKey(null)} />
        </div>
      )}
    </div>
  );
}

// Recursive mobile accordion row for any depth below the first level.
function MobileSubItem({ item, onNavigate, depth }: { item: SubItem; onNavigate: () => void; depth: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <Link
          href={item.href}
          onClick={onNavigate}
          className="flex-1 text-left text-xs py-1.5 px-2 rounded"
          style={{ color: "#dfeee3", paddingLeft: 8 + depth * 12 }}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="px-2 py-1.5 text-white" aria-label={`${item.label} submenu`}>
            <ChevronDown size={12} style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="flex flex-col overflow-y-auto" style={{ maxHeight: SUBMENU_MAX_HEIGHT * 0.75 }}>
          {item.children!.map((sub) => (
            <MobileSubItem key={sub.id} item={sub} onNavigate={onNavigate} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Mobile accordion version of the same top-level nav item. Background fill
// swapped for a slim left-accent bar so it matches the underline language
// used on desktop instead of a full highlighted block. Touch devices don't
// have hover, so this stays click-to-open.
function MobileNavItem({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center transition-colors duration-200"
        style={{ borderLeft: `3px solid ${active ? C.gold : "transparent"}` }}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          className="flex-1 text-left text-sm py-2 pl-2 pr-2"
          style={{ color: active ? "#fff" : "#dfeee3" }}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="px-3 py-2 text-white" aria-label={`${item.label} submenu`}>
            <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none" }} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className="flex flex-col pl-4 mt-0.5 mb-1 overflow-y-auto" style={{ maxHeight: SUBMENU_MAX_HEIGHT }}>
          {item.children!.map((sub) => (
            <MobileSubItem key={sub.id} item={sub} onNavigate={onNavigate} depth={0} />
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
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const { data, ready } = useAppData();
  const navRef = useRef<HTMLDivElement>(null);
  const itemNodes = useRef<Record<string, HTMLDivElement | null>>({});

  // Sliding underline position/size, measured relative to `navRef`.
  // opacity starts at 0 so there's no flash-of-underline before the first
  // measurement runs.
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const registerItemRef = (key: string, el: HTMLDivElement | null) => {
    itemNodes.current[key] = el;
  };

  // Build the navbar straight from the same content the pages themselves
  // render, so "Company Profile ▾" / "Brands & Products ▾" / "Investor
  // Relation ▾" / "Media ▾" always show whatever tabs/categories/items/
  // galleries currently exist — add one in the admin panel and it shows up
  // here automatically, and picking it takes you to that exact content.
  //
  // "Products" is the one section that can be nested arbitrarily deep, so
  // its children are built recursively via buildProductSubItems instead of
  // a flat one-level map.
  const navItems: NavItem[] = [
    { key: "home", label: "Home", href: "/" },
    {
      key: "company-profile",
      label: "About Us",
      href: "/company-profile",
      children: data.companyProfile.tabs.map((t) => ({ id: t.id, label: t.name, href: `/company-profile?tab=${t.id}` })),
    },
    {
      key: "brands-products",
      label: "Products",
      href: "/brands-products",
      children: data.brandsProducts.categories.map((c) => ({
        id: c.id,
        label: c.name,
        href: `/brands-products?cat=${c.id}`,
        children: buildProductSubItems(c.children, c.id, []),
      })),
    },
    {
      key: "investor-relation",
      label: "Investors",
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

  const activeKey =
    navItems.find((item) => (item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)))?.key ?? null;

  const onlineShopUrl = data.siteSettings?.onlineShopUrl?.trim();
  const onlineShopLabel = data.siteSettings?.onlineShopLabel?.trim() || "Online Shop";
  const isExternalShop = !!onlineShopUrl && /^https?:\/\//i.test(onlineShopUrl);

  // Moves the underline to sit under whichever key is passed in. Measures
  // against navRef so it works regardless of scroll position/container width.
  const moveIndicatorTo = (key: string | null) => {
    const nav = navRef.current;
    const el = key ? itemNodes.current[key] : null;
    if (!nav || !el) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({ left: elRect.left - navRect.left, width: elRect.width, opacity: 1 });
  };

  // Hover takes priority over the route-active item while the cursor is
  // inside the nav; on mouse-leave it snaps back to whatever's active.
  const handleHoverChange = (key: string | null) => {
    setHoverKey(key);
    moveIndicatorTo(key ?? activeKey);
  };

  // Keep the underline glued to the active route item whenever it's not
  // currently being overridden by a hover, and re-measure on resize (labels
  // can wrap/reflow at different widths) and whenever nav content changes
  // (e.g. admin adds/removes a category so item widths shift).
  useLayoutEffect(() => {
    if (!hoverKey) moveIndicatorTo(activeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, ready, data.brandsProducts.categories.length, data.companyProfile.tabs.length, data.investorRelation.items.length, data.media.sections.length]);

  useEffect(() => {
    function onResize() {
      moveIndicatorTo(hoverKey ?? activeKey);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverKey, activeKey]);

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
        <div className="max-w-7xl mx-auto px-2 sm:px-3 flex items-center justify-between h-16">
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
      <div className="max-w-7xl mx-auto px-2 sm:px-3 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark
            logoUrl={data.siteSettings?.logoUrl}
            companyName={data.siteSettings?.companyName}
            companySubtitle={data.siteSettings?.companySubtitle}
          />
        </Link>

        <nav
          ref={navRef}
          className="hidden md:flex items-center h-full relative"
          onMouseLeave={() => {
            handleHoverChange(null);
            setOpenKey(null);
          }}
        >
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <DesktopNavButton
                key={item.key}
                item={item}
                active={active}
                openKey={openKey}
                setOpenKey={setOpenKey}
                registerRef={registerItemRef}
                onHoverChange={handleHoverChange}
              />
            );
          })}

          {/* Sliding underline indicator — position/width are measured from
              the hovered (or active) item and animated with a CSS transition,
              so it glides smoothly from one item to the next. */}
          <div
            className="absolute bottom-0 h-[2px] rounded-full pointer-events-none transition-[left,width,opacity] duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              opacity: indicator.opacity,
              backgroundColor: C.gold,
            }}
          />

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
        <div className="md:hidden px-2 sm:px-3 pb-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <MobileNavItem key={item.key} item={item} active={active} onNavigate={() => setMobileOpen(false)} />
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