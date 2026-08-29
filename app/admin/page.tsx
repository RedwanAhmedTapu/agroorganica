"use client";

import Link from "next/link";
import { useAppData } from "@/lib/DataContext";
import { Card, C, Badge } from "@/components/ui";
import AdminHint from "@/components/AdminHint";
import { getTemplate } from "@/lib/homeTemplates";
import {
  GalleryHorizontalEnd,
  Building2,
  Package,
  LineChart,
  Images,
  MessageSquare,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const { data, ready } = useAppData();

  if (!ready) {
    return <p className="text-sm" style={{ color: C.muted }}>Loading…</p>;
  }

  const productCount = data.brandsProducts.categories.reduce((n, c) => n + c.products.length, 0);
  const activeBrands = data.home.brands.filter((b) => b.active).length;
  const gridFilled = data.home.grid.items.filter((i) => i.src).length;
  const galleryImages = data.media.sections.reduce((n, s) => n + s.images.length, 0);
  const pdfCount = data.investorRelation.items.reduce((n, i) => n + i.pdfs.length, 0);

  const cards = [
    {
      href: "/admin/home",
      icon: GalleryHorizontalEnd,
      title: "Home Page",
      desc: `${gridFilled}/5 media in "${getTemplate(data.home.grid.templateId).name}" · ${activeBrands} active brand${activeBrands === 1 ? "" : "s"}`,
    },
    {
      href: "/admin/company-profile",
      icon: Building2,
      title: "Company Profile",
      desc: `${data.companyProfile.tabs.length} tab${data.companyProfile.tabs.length === 1 ? "" : "s"} published`,
    },
    {
      href: "/admin/brands-products",
      icon: Package,
      title: "Brands & Products",
      desc: `${data.brandsProducts.categories.length} categories · ${productCount} products`,
    },
    {
      href: "/admin/investor-relation",
      icon: LineChart,
      title: "Investor Relation",
      desc: `${data.investorRelation.items.length} categories · ${pdfCount} PDFs`,
    },
    {
      href: "/admin/media",
      icon: Images,
      title: "Media",
      desc: `${data.media.sections.length} galleries · ${galleryImages} images`,
    },
    {
      href: "/admin/image-library",
      icon: FolderOpen,
      title: "Image Library",
      desc: "Upload images here first to get a URL for bulk Excel imports",
    },
    {
      href: "/admin/messages",
      icon: MessageSquare,
      title: "Messages",
      desc: `${data.messages.length} message${data.messages.length === 1 ? "" : "s"} received`,
      badge: data.messages.length > 0,
    },
  ];

  return (
    <div>
      <div className="mb-7">
        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.gold }}>
          Overview
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl" style={{ color: C.primary }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Everything you publish here updates the live site instantly.
        </p>
      </div>

      <AdminHint>
        <strong>How this works:</strong> each card below is one section of the public site. Open a
        section, add or edit content, and it goes live immediately — there's no separate "publish"
        step. Adding lots of products or brands at once? Open <strong>Image Library</strong> to
        upload photos and grab their URLs, then use "Bulk Add" on the Brands & Products or Home Page
        section to import them from an Excel sheet. Use <strong>Settings</strong> to change your
        password, manage the navbar logo and footer social links, and see login history.
      </AdminHint>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href}>
              <Card className="p-5 h-full transition-shadow hover:shadow-md group">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: C.primaryTint }}
                  >
                    <Icon size={18} style={{ color: C.primary }} />
                  </div>
                  {c.badge && <Badge tone="gold">New</Badge>}
                </div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: C.text }}>
                  {c.title}
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.primary }} />
                </div>
                <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
                  {c.desc}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
