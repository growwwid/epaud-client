"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, postJson, type MeResult } from "@/components/api";
import {
  ChevronDownIcon,
  FileIcon,
  LogOutIcon,
  UserIcon,
} from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  kepala_sekolah: "Kepala Sekolah",
  admin_sekolah: "Admin Sekolah",
  guru: "Guru",
  orang_tua: "Orang Tua",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MeResult | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    getJson<MeResult>("/api/auth/me").then((result) => {
      if (!active) return;
      if (result.ok) {
        setMe(result.data);
      } else if (result.status === 401) {
        router.replace("/login");
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await postJson("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  const name = me?.nama || "Pengguna";
  const roleLabel = me ? ROLE_LABELS[me.role] ?? me.role : "Memuat...";
  const subtitle = me?.nama_sekolah ? `${roleLabel} · ${me.nama_sekolah}` : roleLabel;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menu profil"
        className={`flex items-center gap-2 rounded-xl p-1.5 pr-2 transition ${
          open ? "bg-slate-100" : "hover:bg-slate-100"
        }`}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-epaud-blue text-sm font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden max-w-[12rem] text-left sm:block">
          <span className="block truncate text-sm font-semibold leading-tight text-slate-800">
            {name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-slate-500">
            {subtitle}
          </span>
        </span>
        <ChevronDownIcon
          className={`hidden size-4 text-slate-400 transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-900/10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UserIcon className="size-5 text-slate-400" />
            Profile
          </button>

          <div className="my-1.5 h-px bg-slate-100" />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileIcon className="size-5 text-slate-400" />
            Report
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
