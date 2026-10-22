"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { humanize } from "@/lib/format";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 13h8v2H8v-2zm0 4h8v2H8v-2z",
  },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !admin) {
    return <LoadingBlock label="Checking your session…" />;
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
            isActive(item.href) ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
            <path d={item.icon} />
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-sm font-semibold text-white">{admin.name}</p>
      <p className="truncate text-xs text-slate-400">{admin.email}</p>
      <p className="mt-1 text-xs text-slate-400">{humanize(admin.role)}</p>
      <button
        type="button"
        onClick={() => logout().then(() => router.replace("/login"))}
        className="mt-3 w-full rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">L</span>
      <span className="text-base font-extrabold text-white">Lendbox Admin</span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col justify-between bg-navy p-4 lg:flex">
        <div className="space-y-8">
          {brand}
          {nav}
        </div>
        {account}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        {brand}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-md p-1.5 text-slate-200 hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
          </svg>
        </button>
      </header>
      {menuOpen && (
        <div className="sticky top-[56px] z-10 space-y-4 bg-navy px-4 pb-4 lg:hidden">
          {nav}
          {account}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
