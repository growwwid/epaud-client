"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  getJson,
  postJson,
  type Notifikasi,
  type NotifikasiList,
} from "@/components/api";
import { BellIcon, CheckIcon, FileIcon } from "@/components/icons";

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "baru saja";
  if (diff < hour) return `${Math.floor(diff / minute)} menit lalu`;
  if (diff < day) return `${Math.floor(diff / hour)} jam lalu`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notifikasi[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(() => {
    getJson<NotifikasiList>("/api/notifikasi").then((res) => {
      if (res.ok) {
        setItems(Array.isArray(res.data.items) ? res.data.items : []);
        setUnread(res.data.unread ?? 0);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

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

  async function markAllRead() {
    if (unread === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
    await postJson("/api/notifikasi/baca", {});
  }

  async function markRead(item: Notifikasi) {
    if (item.is_read) return;
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
    );
    setUnread((value) => Math.max(0, value - 1));
    await postJson("/api/notifikasi/baca", { id: item.id });
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
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
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
              disabled={unread === 0}
              className="text-xs font-semibold text-epaud-blue transition hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
            >
              Tandai semua sebagai sudah dibaca
            </button>
          </div>

          <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-0.5">
            {loading ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">
                Memuat…
              </p>
            ) : items.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">
                Belum ada notifikasi.
              </p>
            ) : (
              items.map((item) => {
                const Icon = item.jenis === "tiket" ? FileIcon : BellIcon;
                const title = item.link ? (
                  <Link
                    href={item.link}
                    onClick={() => {
                      markRead(item);
                      setOpen(false);
                    }}
                    className="hover:underline"
                  >
                    {item.judul}
                  </Link>
                ) : (
                  item.judul
                );
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
                        {!item.is_read ? (
                          <span className="mt-[7px] size-2 shrink-0 rounded-full bg-red-500" />
                        ) : null}
                        <p
                          className={`flex-1 text-sm ${
                            item.is_read
                              ? "font-medium text-slate-500"
                              : "font-semibold text-slate-800"
                          }`}
                        >
                          {title}
                        </p>
                        <button
                          type="button"
                          onClick={() => markRead(item)}
                          aria-label="Tandai sudah dibaca"
                          className={`mt-0.5 shrink-0 rounded-md p-0.5 transition ${
                            item.is_read
                              ? "text-emerald-500"
                              : "text-slate-300 hover:text-epaud-blue"
                          }`}
                        >
                          <CheckIcon className="size-4" />
                        </button>
                      </div>

                      {item.deskripsi ? (
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          {item.deskripsi}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-slate-400">
                        {relativeTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
