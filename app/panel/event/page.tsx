"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  type KalenderItem,
  type MeResult,
} from "@/components/api";
import { EventForm } from "@/components/event-form";
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import {
  EmptyRow,
  PageHeader,
  Panel,
  tableHeadClass,
} from "@/components/crud-ui";
import {
  itemDateKey,
  itemVisual,
  kategoriLabel,
  tipeMeta,
} from "@/lib/kalender";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];
const NONE_KATEGORI = "__none__";

const tanggalSingkat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Urutan daftar: non-ulang tahun menurut updated_at DESC (terbaru diperbarui
 * di atas); ulang tahun selalu di bawah, mengikuti tanggal terdekat.
 */
function sortKey(item: KalenderItem): number {
  if (item.tipe === "ulang_tahun") return Number.NEGATIVE_INFINITY;
  const raw = item.updated_at || item.mulai;
  const value = new Date(raw).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export default function EventPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [items, setItems] = useState<KalenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<KalenderItem | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (res.ok) setRole(res.data.role);
      else if (res.status === 401) router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const now = new Date();
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
      const to = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      const res = await getJson<KalenderItem[]>(`/api/kalender?from=${from}&to=${to}`);
      if (!active) return;
      if (res.ok) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const canManage = role ? MANAGE_ROLES.includes(role) : false;

  async function removeEvent(event: KalenderItem) {
    if (!window.confirm(`Hapus event "${event.judul}"?`)) return;
    setBusyId(event.id);
    const res = await deleteJson(`/api/event/${event.id}`);
    setBusyId(null);
    if (res.ok) setReloadKey((k) => k + 1);
  }

  const kategoriOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.tipe === "libur_nasional") continue;
      set.add((item.kategori ?? "").trim());
    }
    return [...set].sort((a, b) =>
      kategoriLabel(a).localeCompare(kategoriLabel(b), "id"),
    );
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => item.tipe !== "libur_nasional")
      .filter((item) => {
        const kategori = (item.kategori ?? "").trim();
        const matchKategori =
          kategoriFilter === "all" ||
          (kategoriFilter === NONE_KATEGORI ? !kategori : kategori === kategoriFilter);
        if (!matchKategori) return false;
        if (!q) return true;
        return [
          item.judul,
          item.deskripsi ?? "",
          item.lokasi ?? "",
          kategoriLabel(kategori),
          tipeMeta(item.tipe).label,
        ].some((value) => value.toLowerCase().includes(q));
      })
      .sort((a, b) => sortKey(b) - sortKey(a));
  }, [items, query, kategoriFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const todayKey = `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon className="size-6" />}
        title="Event & Ulang Tahun"
        subtitle="Agenda kegiatan sekolah, event, dan ulang tahun anak."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul, kategori, atau lokasi..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(event) => {
              setKategoriFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter kategori"
            className="h-11 w-auto min-w-[11rem] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
          >
            <option value="all">Semua kategori</option>
            {kategoriOptions.map((kategori) => (
              <option key={kategori || NONE_KATEGORI} value={kategori || NONE_KATEGORI}>
                {kategoriLabel(kategori)}
              </option>
            ))}
          </select>
          {canManage ? (
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
            >
              <PlusIcon className="size-5" />
              Tambah Event
            </button>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Agenda</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Lokasi</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={6} label="Memuat agenda..." />
              ) : pageItems.length === 0 ? (
                <EmptyRow colSpan={6} label="Tidak ada agenda." />
              ) : (
                pageItems.map((item, index) => {
                  const visual = itemVisual(item);
                  const past = itemDateKey(item) < todayKey;
                  return (
                    <tr
                      key={`${item.tipe}-${item.id}`}
                      className={`rounded-xl bg-slate-50/60 text-sm text-slate-700 ${
                        past ? "opacity-70" : ""
                      }`}
                    >
                      <td className="rounded-l-xl px-4 py-3 text-slate-500">
                        {start + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 size-2.5 shrink-0 rounded-full ${visual.dot}`}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">{item.judul}</p>
                            {item.deskripsi ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                                {item.deskripsi}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${visual.badge}`}
                        >
                          {kategoriLabel(item.kategori)}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {tipeMeta(item.tipe).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <ClockIcon className="size-3.5 text-slate-400" />
                          {item.all_day
                            ? tanggalSingkat.format(
                                new Date(`${itemDateKey(item)}T00:00:00`),
                              )
                            : `${tanggalSingkat.format(new Date(item.mulai))} ${jam.format(new Date(item.mulai))}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {item.lokasi ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPinIcon className="size-3.5 text-slate-400" />
                            {item.lokasi}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="rounded-r-xl px-4 py-3">
                        {canManage && item.tipe === "event_sekolah" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setFormTarget(item)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEvent(item)}
                              disabled={busyId === item.id}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Menampilkan {filtered.length === 0 ? 0 : start + 1} -{" "}
            {Math.min(start + perPage, filtered.length)} dari {filtered.length} data
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Halaman sebelumnya"
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronDownIcon className="size-4 rotate-90" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                    p === currentPage
                      ? "bg-epaud-blue text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Halaman berikutnya"
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronDownIcon className="size-4 -rotate-90" />
              </button>
            </div>
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-epaud-blue"
            >
              <option value={10}>10 / halaman</option>
              <option value={25}>25 / halaman</option>
              <option value={50}>50 / halaman</option>
            </select>
          </div>
        </div>
      </Panel>

      {formTarget ? (
        <EventForm
          key={formTarget === "new" ? "new" : formTarget.id}
          item={formTarget === "new" ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}
