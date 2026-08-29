import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/DataContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Agro Organica",
  description: "Agro Organica — company profile, brands & products, investor relation and media.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans" style={{ backgroundColor: "#f7f5ef" }}>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
