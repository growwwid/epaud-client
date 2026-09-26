"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  BellIcon,
  BookIcon,
  CheckIcon,
  FileIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";

type IconComponent = ComponentType<{ className?: string }>;

type Notification = {
  id: string;
  title: string;
  description: string;
  icon: IconComponent;
  read: boolean;
  action?: { label: string; tone: "primary" | "dark" };
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Data anak baru ditambahkan",
    description:
      "Ananda Bunga Lestari ditambahkan ke Kelompok A oleh Ibu Sari.",
    icon: UsersIcon,
    read: false,
  },
  {
    id: "n2",
    title: "Kegiatan belajar diperbarui",
    description: "Tema: Binatang di Sekitar Kita. Lihat detail kegiatannya.",
    icon: BookIcon,
    read: false,
    action: { label: "Lihat kegiatan", tone: "primary" },
  },
  {
    id: "n3",
    title: "Penilaian anak disimpan",
    description: "Penilaian Ananda Rafa Pratama (Kelompok B) telah disimpan.",
    icon: StarIcon,
    read: true,
  },
  {
    id: "n4",
    title: "Pengingat laporan bulanan",
    description: "Laporan perkembangan September 2026 menunggu untuk diisi.",
    icon: FileIcon,
    read: false,
    action: { label: "Isi laporan", tone: "dark" },
  },
];

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((item) => !item.read).length;

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

  function markAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function toggleRead(id: string) {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item,
      ),
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifikasi"
        aria-haspopup="true"
        aria-expanded={open}
        className={`relative rounded-xl p-2 transition ${
          open
            ? "bg-epaud-sky text-epaud-blue"
            : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        <BellIcon className="size-6" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,400px)] rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-900/10 max-sm:fixed max-sm:inset-x-3 max-sm:top-[4.5rem] max-sm:mt-0 max-sm:w-auto">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <h3 className="text-lg font-bold text-epaud-navy">Notifikasi</h3>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-semibold text-epaud-blue transition hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
            >
              Tandai semua sebagai sudah dibaca
            </button>
          </div>

          <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-0.5">
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.28)]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-epaud-sky text-epaud-blue">
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      {!item.read ? (
                        <span className="mt-[7px] size-2 shrink-0 rounded-full bg-red-500" />
                      ) : null}
                      <p
                        className={`flex-1 text-sm ${
                          item.read
                            ? "font-medium text-slate-500"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {item.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleRead(item.id)}
                        aria-label={
                          item.read
                            ? "Tandai belum dibaca"
                            : "Tandai sudah dibaca"
                        }
                        className={`mt-0.5 shrink-0 rounded-md p-0.5 transition ${
                          item.read
                            ? "text-emerald-500"
                            : "text-slate-300 hover:text-epaud-blue"
                        }`}
                      >
                        <CheckIcon className="size-4" />
                      </button>
                    </div>

                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      {item.description}
                    </p>

                    {item.action ? (
                      <button
                        type="button"
                        className={`mt-3 inline-flex h-9 items-center rounded-xl px-4 text-sm font-semibold text-white transition ${
                          item.action.tone === "primary"
                            ? "bg-epaud-blue hover:bg-epaud-blue-dark"
                            : "bg-slate-900 hover:bg-slate-800"
                        }`}
                      >
                        {item.action.label}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
