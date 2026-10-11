"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/logo-lockup";
import { getJson, type MeResult, type SekolahProfil } from "@/components/api";
import {
  BookIcon,
  BuildingIcon,
  CalendarIcon,
  ChevronDownIcon,
  FileIcon,
  GridIcon,
  HomeIcon,
  MapPinIcon,
  MenuIcon,
  SearchIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from "@/components/icons";
import { NotificationMenu } from "./notification-menu";
import { ProfileMenu } from "./profile-menu";
import { TahunAjaranProvider } from "./tahun-ajaran-context";
import { TahunAjaranSelect } from "./tahun-ajaran-select";

const DASHBOARD_ITEM = { label: "Dashboard", href: "/panel", icon: HomeIcon };

const TABUNGAN_ITEM = { label: "Tabungan", href: "/panel/tabungan", icon: WalletIcon };

const SEKOLAH_ITEM = { label: "Sekolah", href: "/panel/sekolah", icon: BuildingIcon };

const ABSENSI_ITEM = { label: "Absensi", href: "/panel/absensi", icon: MapPinIcon };

const MASTER_ITEMS = [
  { label: "Guru", href: "/panel/guru", icon: UserIcon },
  { label: "Admin Sekolah", href: "/panel/admin", icon: BuildingIcon },
  { label: "Orang Tua", href: "/panel/orang-tua", icon: UsersIcon },
  { label: "Murid", href: "/panel/murid", icon: UsersIcon },
  { label: "Kelas", href: "/panel/kelas", icon: GridIcon },
];

const AGENDA_ITEMS = [
  { label: "Event", href: "/panel/event", icon: StarIcon },
  { label: "Kalender", href: "/panel/kalender", icon: CalendarIcon },
];

const SUPERADMIN_ITEMS = [
  { label: "Kelola Sekolah", href: "/panel/kelola-sekolah", icon: BuildingIcon },
  { label: "Tiket Kendala", href: "/panel/tiket", icon: FileIcon },
];

export function PanelShell({
  children,
  initialMe,
  initialProfil,
}: {
  children: ReactNode;
  initialMe?: MeResult | null;
  initialProfil?: SekolahProfil | null;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(true);
  const [role, setRole] = useState<string | null>(initialMe?.role ?? null);
  const [profil, setProfil] = useState<SekolahProfil | null>(
    initialProfil ?? null,
  );

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await getJson<MeResult>("/api/auth/me");
      if (!active || !res.ok) return;
      setRole(res.data.role);
      if (res.data.role !== "superadmin") {
        const profilRes = await getJson<SekolahProfil>("/api/profil-sekolah");
        if (active && profilRes.ok) setProfil(profilRes.data);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profil?.logo) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = profil.logo;
  }, [profil]);

  const isManage = role === "kepala_sekolah" || role === "admin_sekolah";
  const isGuru = role === "guru";
  const isOrtu = role === "orang_tua";
  const isSuperadmin = role === "superadmin";
  const showDashboard = !isOrtu;
  const showMaster = isManage;
  const showTabungan = isManage || isOrtu;
  const showAgenda = isManage || isGuru || isOrtu;

  return (
    <TahunAjaranProvider enabled={isManage}>
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
          <LogoLockup compact logo={profil?.logo} nama={profil?.nama} />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 lg:hidden"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {isManage ? <TahunAjaranSelect /> : null}

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {showDashboard ? (
            <SidebarLink
              item={DASHBOARD_ITEM}
              active={pathname === DASHBOARD_ITEM.href}
              onNavigate={() => setSidebarOpen(false)}
            />
          ) : null}

          {showTabungan ? (
            <SidebarLink
              item={TABUNGAN_ITEM}
              active={
                pathname === TABUNGAN_ITEM.href ||
                pathname.startsWith(`${TABUNGAN_ITEM.href}/`)
              }
              onNavigate={() => setSidebarOpen(false)}
            />
          ) : null}

          {isManage ? (
            <SidebarLink
              item={SEKOLAH_ITEM}
              active={pathname === SEKOLAH_ITEM.href}
              onNavigate={() => setSidebarOpen(false)}
            />
          ) : null}

          {isManage || isGuru ? (
            <SidebarLink
              item={ABSENSI_ITEM}
              active={pathname === ABSENSI_ITEM.href}
              onNavigate={() => setSidebarOpen(false)}
            />
          ) : null}

          {showMaster ? (
            <div>
              <button
                type="button"
                onClick={() => setMasterOpen((value) => !value)}
                aria-expanded={masterOpen}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <BookIcon className="size-5 shrink-0" />
                Master Data
                <ChevronDownIcon
                  className={`ml-auto size-4 text-slate-400 transition-transform ${
                    masterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {masterOpen ? (
                <div className="mt-1 space-y-1 border-l border-slate-100 pl-3">
                  {MASTER_ITEMS.map((item) => (
                    <SidebarLink
                      key={item.label}
                      item={item}
                      indent
                      active={pathname === item.href}
                      onNavigate={() => setSidebarOpen(false)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {showAgenda
            ? AGENDA_ITEMS.map((item) => (
                <SidebarLink
                  key={item.label}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))
            : null}

          {isSuperadmin
            ? SUPERADMIN_ITEMS.map((item) => (
                <SidebarLink
                  key={item.label}
                  item={item}
                  active={pathname === item.href}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))
            : null}
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
    </TahunAjaranProvider>
  );
}

type NavItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => ReactNode;
};

function SidebarLink({
  item,
  active,
  indent = false,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  indent?: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition ${
        indent ? "px-3 py-2" : "px-3 py-2.5"
      } ${
        active
          ? "bg-epaud-sky text-epaud-blue"
          : indent
            ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className={indent ? "size-4 shrink-0" : "size-5 shrink-0"} />
      {item.label}
    </Link>
  );
}
