"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getJson, type DashboardStats, type KalenderItem, type MeResult } from "@/components/api";
import { MiniCalendar } from "@/components/mini-calendar";
import { StatCard } from "@/components/stat-card";
import { itemDateKey, tipeMeta } from "@/lib/kalender";
import { useTahunAjaran } from "./tahun-ajaran-context";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  kepala_sekolah: "Kepala Sekolah",
  admin_sekolah: "Admin Sekolah",
  guru: "Guru",
  orang_tua: "Orang Tua",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function PanelPage() {
  const router = useRouter();
  const { withTahunAjaran } = useTahunAjaran();
  const [me, setMe] = useState<MeResult | null>(null);
  const [events, setEvents] = useState<KalenderItem[]>([]);
  const [jumlahGuru, setJumlahGuru] = useState<number | null>(null);
  const [jumlahMurid, setJumlahMurid] = useState<number | null>(null);
  const [totalSaldo, setTotalSaldo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const meRes = await getJson<MeResult>("/api/auth/me");
      if (!active) return;
      if (!meRes.ok) {
        if (meRes.status === 401) router.replace("/login");
        else setError(meRes.error.message);
        setLoading(false);
        return;
      }

      setMe(meRes.data);
      const role = meRes.data.role;

      const requests: Promise<unknown>[] = [];
      if (role !== "superadmin") requests.push(loadEvents());

      if (MANAGE_ROLES.includes(role)) {
        requests.push(
          (async () => {
            const res = await getJson<DashboardStats>(
              withTahunAjaran("/api/dashboard"),
            );
            if (!active || !res.ok) return;
            setJumlahGuru(res.data.jumlah_guru ?? 0);
            setJumlahMurid(res.data.jumlah_murid ?? 0);
            setTotalSaldo(res.data.total_saldo ?? 0);
          })(),
        );
      }

      await Promise.all(requests);
      if (active) setLoading(false);
    }

    // Agregasi kalender (event sekolah, libur, ulang tahun) untuk bulan ini
    // sampai dua bulan ke depan.
    async function loadEvents() {
      const now = new Date();
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      const to = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      const res = await getJson<KalenderItem[]>(`/api/kalender?from=${from}&to=${to}`);
      if (active && res.ok) setEvents(Array.isArray(res.data) ? res.data : []);
    }

    load();
    return () => {
      active = false;
    };
  }, [router, withTahunAjaran]);

  const todayKey = `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => itemDateKey(event) >= todayKey)
        .sort((a, b) => a.mulai.localeCompare(b.mulai))
        .slice(0, 5),
    [events, todayKey],
  );

  const isManage = me ? MANAGE_ROLES.includes(me.role) : false;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
          <CalendarIcon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
            {me ? `Halo, ${me.nama}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {me
              ? `${ROLE_LABEL[me.role] ?? me.role}${me.nama_sekolah ? ` · ${me.nama_sekolah}` : ""}`
              : "Ringkasan sekolah Anda."}
          </p>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}

      {/* Statistik */}
      {isManage ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<UserIcon className="size-5" />}
            label="Jumlah Guru"
            value={loading ? "…" : String(jumlahGuru ?? "—")}
          />
          <StatCard
            icon={<UsersIcon className="size-5" />}
            label="Jumlah Anak"
            value={loading ? "…" : String(jumlahMurid ?? "—")}
          />
          <StatCard
            icon={<WalletIcon className="size-5" />}
            label="Total Saldo Tabungan"
            value={loading ? "…" : rupiah.format(totalSaldo ?? 0)}
          />
        </div>
      ) : null}

      {/* Event + kalender */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Event Mendatang
            </h2>
            <Link
              href="/panel/event"
              className="text-xs font-semibold text-epaud-blue transition hover:text-epaud-blue-dark"
            >
              Lihat semua
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
              Belum ada event mendatang.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((event) => {
                const meta = tipeMeta(event.tipe);
                return (
                  <li
                    key={`${event.tipe}-${event.id}`}
                    className="flex items-start gap-4 rounded-xl bg-slate-50/70 p-4"
                  >
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-white ${meta.dot}`}
                    >
                      <CalendarIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{event.judul}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      {event.deskripsi ? (
                        <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                          {event.deskripsi}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="size-3.5" />
                          {event.all_day
                            ? tanggal.format(
                                new Date(`${itemDateKey(event)}T00:00:00`),
                              )
                            : `${tanggal.format(new Date(event.mulai))} · ${jam.format(new Date(event.mulai))}`}
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
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <MiniCalendar events={events} />
          <p className="mt-4 text-xs text-slate-400">
            Tanggal bertanda titik memiliki event.
          </p>
        </div>
      </div>
    </div>
  );
}
