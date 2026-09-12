"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Leaf, MapPin, Phone, Mail, Globe, Settings, ChevronDown, FileText } from "lucide-react";
import { C } from "./ui";
import { getFooterSettings, getFileUrl } from "@/lib/api";
import { useAppData } from "@/lib/DataContext";

type FooterChild = { id: string; label: string; href: string; external: boolean };
type FooterEntry = { id: string; label: string; href: string; children?: FooterChild[] };
type FooterColumn = { id: string; title: string; entries: FooterEntry[] };

function SocialIcon({ name, size = 15, color }: { name: string; size?: number; color?: string }) {
  const Icon = (Icons as any)[name] || Icons.Globe;
  return <Icon size={size} color={color} />;
}

function FooterLinkAnchor({ label, href, external }: { label: string; href: string; external: boolean }) {
  const cls = "text-sm break-words transition-colors hover:text-white";
  const style = { color: "#ecf3ec" };
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={style}>
      {label}
    </Link>
  );
}

// A single row under a footer heading. Most entries are just a plain link.
// But when an entry has its own sub-content (a Company Profile tab that
// lists board/achievement members, or an Investor Relation item with PDFs
// attached), it renders as its own small dropdown instead — collapsed by
// default, expanding to show that sub-content when tapped. Entries with no
// sub-content (a plain text tab, an investor item with no PDFs yet, any
// media gallery) stay a simple link, no dropdown arrow at all.
function FooterEntryRow({ entry }: { entry: FooterEntry }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!entry.children && entry.children.length > 0;

  if (!hasChildren) {
    return <FooterLinkAnchor label={entry.label} href={entry.href} external={false} />;
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-start gap-1.5 text-sm text-left transition-colors hover:text-white w-full"
        style={{ color: "#ecf3ec" }}
      >
        <span className="break-words min-w-0">{entry.label}</span>
        <ChevronDown size={12} className="shrink-0 mt-0.5" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <ul className="flex flex-col gap-2 mt-2 pl-3 min-w-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
          {entry.children!.map((c) => (
            <li key={c.id} className="text-xs min-w-0">
              <FooterLinkAnchor label={c.label} href={c.href} external={c.external} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Column heading (Quick Links / Investors / Media) itself is always plain
// text, never collapsible — only the individual entries beneath it turn
// into dropdowns, and only the ones that actually have sub-content.
function FooterColumnBlock({ col }: { col: FooterColumn }) {
  return (
    <div className="min-w-0">
      <div className="text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">{col.title}</div>
      {col.entries.length === 0 ? (
        <p className="text-xs" style={{ color: "#a9c2af" }}>
          Nothing published yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 min-w-0">
          {col.entries.map((e) => (
            <li key={e.id} className="min-w-0">
              <FooterEntryRow entry={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const [certifications, setCertifications] = useState<string[]>([]);
  const [productBrochureUrl, setProductBrochureUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<{ id: string; platform: string; icon: string; url: string; color?: string; active: boolean }[]>([]);
  const { data } = useAppData();
  const s = data.siteSettings;

  useEffect(() => {
    getFooterSettings()
      .then((r) => {
        setCertifications(r.certifications || []);
        setProductBrochureUrl(r.productBrochureUrl || "");
        setSocialLinks(r.socialLinks.filter((l) => l.active));
      })
      .catch(() => {});
  }, []);

  // Quick Links / Investors / Media are generated straight from the same
  // content that drives the navbar dropdowns (Company Profile tabs,
  // Investor Relation items, Media galleries). Add/rename/remove a tab,
  // item or gallery on its own admin page and the footer updates itself —
  // nothing to duplicate here.
  //
  // Each entry only becomes an expandable dropdown when it has its own
  // sub-content:
  //  - Quick Links: a "profile"/"achievement" tab lists its members/items
  //  - Investors: an item expands to its attached PDFs (linking straight
  //    to each file) if any have been uploaded
  //  - Media: galleries have nothing further to drill into, so they always
  //    stay a plain link
  const columns: FooterColumn[] = [
    {
      id: "quick-links",
      title: "Quick Links",
      entries: data.companyProfile.tabs.map((t) => {
        const href = `/company-profile?tab=${t.id}`;
        if (t.type === "profile" && t.items.length > 0) {
          return {
            id: t.id,
            label: t.name,
            href,
            children: t.items.map((m) => ({ id: m.id, label: m.name, href, external: false })),
          };
        }
        if (t.type === "achievement" && t.items.length > 0) {
          return {
            id: t.id,
            label: t.name,
            href,
            children: t.items.map((a) => ({ id: a.id, label: a.title, href, external: false })),
          };
        }
        return { id: t.id, label: t.name, href };
      }),
    },
    {
      id: "investors",
      title: "Investors",
      entries: data.investorRelation.items.map((i) => {
        const href = `/investor-relation?item=${i.id}`;
        if (i.pdfs.length > 0) {
          return {
            id: i.id,
            label: i.name,
            href,
            children: i.pdfs.map((p) => ({ id: p.id, label: p.name, href: getFileUrl(p.dataUrl), external: true })),
          };
        }
        return { id: i.id, label: i.name, href };
      }),
    },
    {
      id: "media",
      title: "Media",
      entries: data.media.sections.map((sec) => ({
        id: sec.id,
        label: sec.title,
        href: `/media#${sec.id}`,
      })),
    },
  ];

  const brochureIsUpload = productBrochureUrl.startsWith("/uploads/");
  const brochureHref = productBrochureUrl ? (brochureIsUpload ? getFileUrl(productBrochureUrl) : productBrochureUrl) : "";

  return (
    <footer className="relative" style={{ backgroundColor: C.primary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
        {/* Brand block: logo/name/subtitle, description, and the
            certification badges directly underneath — all as one column
            on the left. */}
        <div className="grid gap-8 md:gap-10 md:grid-cols-[280px_1fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white shrink-0 overflow-hidden">
                {s?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getFileUrl(s.logoUrl)} alt={s.companyName || "Logo"} className="w-full h-full object-contain p-1" />
                ) : (
                  <Leaf size={18} style={{ color: C.primary }} />
                )}
              </div>
              <div className="leading-tight">
                <div className="text-orange-600 font-serif font-semibold text-sm tracking-wide">
                  {s?.companyName || "Agro Organica"}
                </div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "#ecf3ec" }}>
                  {s?.companySubtitle || "Nurture Nature"}
                </div>
              </div>
            </div>
            {s?.footerDescription && (
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#ecf3ec" }}>
                {s.footerDescription}
              </p>
            )}

            {/* Certification badges — sit directly under the logo/name/
                description, not as their own grid column. */}
            {certifications.length > 0 && (
              <div className="flex flex-col gap-2">
                {certifications.map((c, i) => (
                  <div
                    key={i}
                    className="text-center text-xs font-semibold uppercase tracking-wide px-4 py-1.5 rounded break-words"
                    style={{ border: "1px solid rgba(255,255,255,0.35)", color: "#fff" }}
                  >
                    {c}
                  </div>
                ))}
                <div className="text-[11px] font-semibold basis-full mt-1" style={{ color: "#ecf3ec" }}>
                  Certified Company
                </div>
              </div>
            )}
          </div>

          {/* Quick Links / Investors / Media / Address — all inline with
              the brand block above, side by side on the same row. */}
          <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-4 min-w-0">
            {columns.map((col) => (
              <FooterColumnBlock key={col.id} col={col} />
            ))}

            <div className="col-span-2 sm:col-span-1 min-w-0">
              <div className="text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">Address</div>
              <ul className="flex flex-col gap-3 min-w-0">
                {s?.contactAddress && (
                  <li className="flex items-start gap-2.5 text-sm min-w-0" style={{ color: "#ecf3ec" }}>
                    <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
                    <span className="break-words min-w-0">{s.contactAddress}</span>
                  </li>
                )}
                {s?.contactPhone && (
                  <li className="flex items-center gap-2.5 text-sm min-w-0" style={{ color: "#ecf3ec" }}>
                    <Phone size={15} className="shrink-0" style={{ color: C.gold }} />
                    <span className="break-words min-w-0">{s.contactPhone}</span>
                  </li>
                )}
                {s?.contactEmail && (
                  <li className="flex items-start gap-2.5 text-sm min-w-0" style={{ color: "#ecf3ec" }}>
                    <Mail size={15} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
                    <span className="break-words min-w-0" style={{ overflowWrap: "anywhere" }}>
                      {s.contactEmail}
                    </span>
                  </li>
                )}
                {s?.contactWebsite && (
                  <li className="flex items-start gap-2.5 text-sm min-w-0" style={{ color: "#ecf3ec" }}>
                    <Globe size={15} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
                    <span className="break-words min-w-0" style={{ overflowWrap: "anywhere" }}>
                      {s.contactWebsite}
                    </span>
                  </li>
                )}
              </ul>

              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 mt-5 flex-wrap">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/30"
                      style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                    >
                      <SocialIcon name={link.icon} color={link.color || undefined} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-10 sm:mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-center sm:text-left"
          style={{ borderTop: "1px solid rgba(255,255,255,0.15)", color: "#ecf3ec" }}
        >
          <span>&copy; {year} {s?.companyName || "Agro Organica"}. All rights reserved.</span>
          <Link href="/admin" title="Admin settings" className="inline-flex items-center gap-1 hover:text-white">
            <Settings size={13} /> Settings
          </Link>
        </div>
      </div>

      {/* Vertical "Product Brochure" tab, fixed to the right edge on
          larger screens — hidden on phones/small tablets where a
          screen-edge tab would overlap content and be hard to tap
          precisely; the brochure is still reachable there via any Quick
          Links / Media entry that links to it, or by widening the browser. */}
      {brochureHref && (
        <a
          href={brochureHref}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 items-center gap-2 px-2.5 py-4 rounded-l-md z-40 shadow-lg"
          style={{ backgroundColor: "#1d5fae", color: "#fff", writingMode: "vertical-rl" }}
        >
          <FileText size={14} />
          <span className="text-xs font-semibold tracking-wide">Product Brochure</span>
        </a>
      )}
    </footer>
  );
}