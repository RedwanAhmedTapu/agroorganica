"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  GalleryHorizontalEnd,
  Building2,
  Package,
  LineChart,
  Images,
  MessageSquare,
  Leaf,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { C } from "@/components/ui";
import { useAuth } from "@/lib/AuthContext";

const ADMIN_TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/home", label: "Home Page", icon: GalleryHorizontalEnd },
  { href: "/admin/company-profile", label: "Company Profile", icon: Building2 },
  { href: "/admin/brands-products", label: "Brands & Products", icon: Package },
  { href: "/admin/investor-relation", label: "Investor Relation", icon: LineChart },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/image-library", label: "Image Library", icon: FolderOpen },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, logout } = useAuth();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname?.startsWith(href));
  const isLoginPage = pathname === "/admin/login";

  // Route guard: any /admin/* page other than /admin/login requires an
  // authenticated session. The JWT lives in an httpOnly cookie, never in
  // localStorage, so this check always goes through the API.
  useEffect(() => {
    if (!isLoginPage && !loading && !admin) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, loading, admin, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || (!admin && !isLoginPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.cream }}>
        <Loader2 className="animate-spin" style={{ color: C.primary }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="h-14 flex items-center px-4 gap-3 sticky top-0 z-20" style={{ backgroundColor: C.primary }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fff" }}>
            <Leaf size={14} style={{ color: C.primary }} />
          </div>
          <span className="text-white text-sm font-serif font-semibold hidden sm:inline">Agro Organica — Admin</span>
        </div>
        {admin && (
          <span className="text-xs hidden md:inline" style={{ color: "#cfe0d4" }}>
            {admin.username}
          </span>
        )}
        <button
          onClick={async () => {
            await logout();
            router.push("/admin/login");
          }}
          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-white"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        >
          <LogOut size={14} /> Log out
        </button>
        <Link href="/" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md text-white" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          <ArrowLeft size={14} /> Back to site
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 md:flex gap-8 items-start">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col gap-1 w-56 shrink-0 sticky top-20">
          {ADMIN_TABS.map((t) => {
            const active = isActive(t.href, t.exact);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: active ? C.primary : "transparent",
                  color: active ? "#fff" : C.text,
                }}
              >
                <Icon size={16} style={{ color: active ? "#fff" : C.muted }} />
                {t.label}
              </Link>
            );
          })}
        </aside>

        {/* Tabs (mobile) */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-1">
          {ADMIN_TABS.map((t) => {
            const active = isActive(t.href, t.exact);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-1.5 shrink-0 text-xs font-semibold px-3.5 py-2 rounded-full"
                style={{
                  backgroundColor: active ? C.primary : "#fff",
                  color: active ? "#fff" : C.text,
                  border: `1px solid ${active ? C.primary : C.border}`,
                }}
              >
                <Icon size={13} />
                {t.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
