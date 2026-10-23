"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { humanize } from "@/lib/format";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Overview and insights",
    icon: "M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10-3h8v11h-8V10z",
  },
  {
    href: "/admin/applications",
    label: "Applications",
    description: "Manage loan requests",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2.5L18.5 10H13V4.5zM6 20V4h5v8h7v8H6zM8 14h8v1.5H8zm0 3h8v1.5H8z",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  if (status !== "authenticated" || !admin) {
    return <LoadingBlock label="Checking your session…" />;
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const brand = (
    <Link href="/admin" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 text-xl font-black text-white shadow-lg shadow-teal-950/30">
        L
      </span>
      <span>
        <span className="block text-[15px] font-extrabold tracking-[0.12em] text-white">
          LENDBOX
        </span>
        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Admin console
        </span>
      </span>
    </Link>
  );

  const nav = (
    <nav aria-label="Admin navigation" className="space-y-1.5">
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        Main menu
      </p>

      {NAV.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
              active
                ? "bg-teal-500/15 text-teal-300"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-teal-400" />
            )}

            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
                active
                  ? "bg-teal-500/15 text-teal-300"
                  : "bg-white/[0.04] text-slate-400 group-hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d={item.icon} />
              </svg>
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold">
                {item.label}
              </span>
              <span
                className={`mt-0.5 block text-[11px] ${
                  active ? "text-teal-300/70" : "text-slate-500"
                }`}
              >
                {item.description}
              </span>
            </span>

            {active && (
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  const account = (
    <div className="border-t border-white/[0.08] pt-4">
      <div className="flex items-center gap-3 rounded-xl p-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-teal-400/20 bg-teal-400/10 text-sm font-bold text-teal-300">
          {admin.name?.trim().charAt(0).toUpperCase() || "A"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">
            {admin.name}
          </p>
          <p className="truncate text-[11px] text-slate-400">{admin.email}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-2">
        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {humanize(admin.role)}
        </span>

        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          Sign out ↗
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:pl-[260px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/[0.06] bg-[#111827] px-5 py-6 lg:flex">
        <div>{brand}</div>

        <div className="mt-11 flex-1">{nav}</div>

        <div className="rounded-xl border border-teal-400/10 bg-teal-400/[0.04] p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-semibold text-slate-300">
              Admin workspace
            </span>
          </div>
          <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
            Manage applications and monitor operations.
          </p>
        </div>

        <div className="mt-5">{account}</div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-700 text-lg font-black text-white">
            L
          </span>
          <span className="text-sm font-extrabold tracking-wider text-slate-900">
            LENDBOX
          </span>
        </Link>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-none stroke-current"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile navigation */}
      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-30 overflow-y-auto bg-[#111827] p-5 lg:hidden">
          {nav}
          <div className="mt-8">{account}</div>
        </div>
      )}

      {/* Workspace top bar */}
      <div className="sticky top-0 z-20 hidden h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-7 backdrop-blur lg:flex">
        <div>
          <p className="text-xs font-medium text-slate-400">
            Workspace / Admin
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700">
            {NAV.find((item) => isActive(item.href))?.label || "Admin"}
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100">
              {admin.name?.trim().charAt(0).toUpperCase() || "A"}
            </span>
            <span className="text-left">
              <span className="block text-xs font-bold text-slate-800">
                {admin.name}
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-500">
                {humanize(admin.role)}
              </span>
            </span>
            <span className="text-xs text-slate-400">⌄</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
              <p className="truncate px-2 py-1 text-xs text-slate-500">
                {admin.email}
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-7 lg:py-8">
        {children}
      </main>
    </div>
  );
}
