"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, type Event, type MeResult } from "@/components/api";
import { PageHeader, Panel } from "@/components/crud-ui";
import { DUMMY_EVENTS } from "@/components/dummy-data";
import { MiniCalendar, dateKey } from "@/components/mini-calendar";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
} from "@/components/icons";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];

const KATEGORI: Record<string, { label: string; className: string }> = {
  kegiatan: { label: "Kegiatan", className: "bg-epaud-sky text-epaud-blue" },
  libur: { label: "Libur", className: "bg-rose-50 text-rose-500" },
  rapat: { label: "Rapat", className: "bg-violet-50 text-violet-600" },
  lainnya: { label: "Lainnya", className: "bg-slate-100 text-slate-500" },
};

const tanggal = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatWaktu(event: Event) {
  const start = new Date(event.tanggal_mulai);
  if (event.all_day) return tanggal.format(start);
  return `${tanggal.format(start)} · ${jam.format(start)}`;
}

export default function EventPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (!active) return;
      if (res.ok) setRole(res.data.role);
      else if (res.status === 401) router.replace("/login");
    });
    return () => {
      active = false;
    };
  }, [router]);

  const canManage = role ? MANAGE_ROLES.includes(role) : false;
  const todayKey = dateKey(new Date());

  const events = useMemo(
    () =>
      [...DUMMY_EVENTS].sort((a, b) =>
        a.tanggal_mulai.localeCompare(b.tanggal_mulai),
      ),
    [],
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon className="size-6" />}
        title="Event Sekolah"
        subtitle="Agenda kegiatan sekolah yang dapat dilihat guru dan orang tua."
      />

      <div className="rounded-xl bg-amber-50 px-4 py-3 text-[13px] font-medium text-amber-700">
        Fitur event sedang disiapkan. Daftar di bawah masih data contoh; backend
        event belum tersedia.
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Daftar Event
              </h2>
              {canManage ? (
                <button
                  type="button"
                  disabled
                  title="Menunggu API event"
                  className="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-4 text-sm font-bold text-white"
                >
                  <PlusIcon className="size-4" />
                  Tambah Event
                </button>
              ) : null}
            </div>

            <ul className="mt-4 space-y-3">
              {events.map((event) => {
                const past = dateKey(event.tanggal_mulai) < todayKey;
                const kategori =
                  KATEGORI[event.kategori ?? "lainnya"] ?? KATEGORI.lainnya;
                return (
                  <li
                    key={event.id}
                    className={`flex items-start gap-4 rounded-xl p-4 ${
                      past ? "bg-slate-50/50 opacity-70" : "bg-slate-50/70"
                    }`}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-epaud-blue ring-1 ring-slate-100">
                      <CalendarIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">
                          {event.judul}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${kategori.className}`}
                        >
                          {kategori.label}
                        </span>
                      </div>
                      {event.deskripsi ? (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {event.deskripsi}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="size-3.5" />
                          {formatWaktu(event)}
                        </span>
                        {event.lokasi ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPinIcon className="size-3.5" />
                            {event.lokasi}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <MiniCalendar events={DUMMY_EVENTS} />
        </div>
      </div>
    </div>
  );
}
