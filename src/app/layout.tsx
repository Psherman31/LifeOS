import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS",
  description: "A system for cultivating a good life",
  appleWebApp: { capable: true, title: "LifeOS", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf8f4",
};

const tabs = [
  { href: "/", label: "Today" },
  { href: "/browse", label: "Browse" },
  { href: "/chat", label: "Talk" },
  { href: "/ledger", label: "Ledger" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <div className="mx-auto max-w-lg px-4 pb-24 pt-5">{children}</div>
        <nav className="fixed bottom-0 inset-x-0 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto max-w-lg flex justify-around pb-[env(safe-area-inset-bottom)]">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex-1 py-3.5 text-center text-sm font-medium text-soft hover:text-ink"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </body>
    </html>
  );
}
