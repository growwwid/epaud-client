"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/logo-lockup";
import {
  BookIcon,
  FileIcon,
  GridIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";
import { NotificationMenu } from "./notification-menu";
import { ProfileMenu } from "./profile-menu";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/panel", icon: HomeIcon },
  { label: "Data Anak", href: "#", icon: UsersIcon },
  { label: "Data Guru", href: "#", icon: UserIcon },
  { label: "Kelas", href: "#", icon: GridIcon },
  { label: "Kegiatan Belajar", href: "#", icon: BookIcon },
  { label: "Penilaian", href: "#", icon: StarIcon },
  { label: "Laporan", href: "#", icon: FileIcon },
  { label: "Pengaturan", href: "#", icon: SettingsIcon },
];

export function PanelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-epaud text-slate-800">
      {/* Backdrop for the mobile sidebar */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <LogoLockup compact />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 lg:hidden"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-epaud-sky text-epaud-blue"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-epaud-sky to-white p-4">
            <p className="text-xs font-bold text-epaud-navy">ePAUD v0.1</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Sistem Informasi Pendidikan Anak Usia Dini.
            </p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            >
              <MenuIcon className="size-5" />
            </button>

            <div className="relative hidden flex-1 sm:block sm:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Cari data anak, guru, atau kegiatan..."
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
              <NotificationMenu />
              <ProfileMenu />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
          <p className="text-center text-xs text-slate-500 sm:text-left">
            © 2026 ePAUD — Sistem Informasi Pendidikan Anak Usia Dini.
          </p>
        </footer>
      </div>
    </div>
  );
}
