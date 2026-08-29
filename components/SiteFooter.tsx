"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Leaf, MapPin, Phone, Mail, Settings } from "lucide-react";
import { C } from "./ui";
import { getFooterSettings, SocialLink } from "@/lib/api";
import { useAppData } from "@/lib/DataContext";

// Quick Links are intentionally static — only the social icons/links and the
// text fields below are admin-editable (Settings page).
const LINKS = [
  { href: "/company-profile", label: "Company Profile" },
  { href: "/brands-products", label: "Brands & Products" },
  { href: "/investor-relation", label: "Investor Relation" },
  { href: "/media", label: "Media" },
  { href: "/contact", label: "Contact" },
];

function SocialIcon({ name, size = 15, color }: { name: string; size?: number; color?: string }) {
  const Icon = (Icons as any)[name] || Icons.Globe;
  return <Icon size={size} color={color} />;
}

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const { data } = useAppData();
  const s = data.siteSettings;

  useEffect(() => {
    getFooterSettings()
      .then((r) => setSocialLinks(r.socialLinks.filter((l) => l.active)))
      .catch(() => setSocialLinks([]));
  }, []);

  return (
    <footer style={{ backgroundColor: C.primary }}>
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white shrink-0 overflow-hidden">
                {s?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoUrl} alt={s.companyName || "Logo"} className="w-full h-full object-contain p-1" />
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
            <p className="text-sm leading-relaxed" style={{ color: "#ecf3ec" }}>
              {s?.footerDescription ||
                "Contract farming, trading, processing and manufacturing — carrying wholesome products from Bangladesh to homes across the world."}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-5">
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

          {/* Quick Links (static) */}
          <div>
            <div className="text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">Quick Links</div>
            <ul className="flex flex-col gap-2.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:text-gray-900"
                    style={{ color: "#ecf3ec" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">Contact</div>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-sm" style={{ color: "#ecf3ec" }}>
                <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: C.gold }} />
                <span>{s?.contactAddress || "Elephant Road, Dhaka, Bangladesh"}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm" style={{ color: "#ecf3ec" }}>
                <Phone size={15} className="shrink-0" style={{ color: C.gold }} />
                <span>{s?.contactPhone || "+880 1XXX-XXXXXX"}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm" style={{ color: "#ecf3ec" }}>
                <Mail size={15} className="shrink-0" style={{ color: C.gold }} />
                <span>{s?.contactEmail || "info@agroorganica.com"}</span>
              </li>
            </ul>
          </div>

          {/* Our Brand */}
          <div>
            <div className="text-orange-600 text-xs font-semibold uppercase tracking-widest mb-4">Our Brand</div>
            <p className="text-sm leading-relaxed" style={{ color: "#ecf3ec" }}>
              {s?.ourBrandText ||
                '"Khusboo" carries close to 100 product varieties into homes across all 64 districts of Bangladesh and beyond.'}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid rgba(0,0,0,0.15)", color: "#ecf3ec" }}
        >
          <span>&copy; {year} {s?.companyName || "Agro Organica"}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Registered in Bangladesh · Sherpur BSCIC · Dhaka Head Office</span>
            <Link href="/admin" title="Admin settings" className="inline-flex items-center gap-1 hover:text-gray-900">
              <Settings size={13} /> Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
