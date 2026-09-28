"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getEnvelope,
  getJson,
  type AnakTabungan,
  type ApiResult,
  type MeResult,
  type RingkasanTabungan,
  type SaldoMurid,
  type TabunganRekap,
} from "@/components/api";
import { CatatTransaksiModal } from "@/components/catat-transaksi-modal";
import { downloadCsv } from "@/components/csv";
import { ErrorText } from "@/components/crud-ui";
import { TabunganHeatmap } from "@/components/tabungan-heatmap";
import {
  ChevronDownIcon,
  DownloadIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  WalletIcon,
} from "@/components/icons";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatTanggal(value?: string) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

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

function tipeLabel(tipe: string) {
  if (tipe === "setor") return "Setor";
  if (tipe === "tarik") return "Tarik";
  return "Penyesuaian";
}

/**
 * Ambil seluruh rekap (semua halaman) agar filter kelas/nama & export berjalan
 * di client. ponytail: ambil-semua, pindah ke filter backend bila murid > ~1000.
 */
async function fetchAllRekap(): Promise<ApiResult<SaldoMurid[]>> {
  const size = 100;
  const all: SaldoMurid[] = [];
  for (let page = 1; ; page += 1) {
    const res = await getEnvelope<TabunganRekap>(
      `/api/tabungan/rekap?page=${page}&size=${size}`,
    );
    if (!res.ok) return res;
    const batch = res.data.data ?? [];
    all.push(...batch);
    const total = res.data.meta?.total ?? all.length;
    if (batch.length === 0 || all.length >= total) return { ok: true, data: all };
  }
}

export default function TabunganPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [rows, setRows] = useState<SaldoMurid[]>([]);
  const [ringkasan, setRingkasan] = useState<RingkasanTabungan | null>(null);
  const [query, setQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catatTarget, setCatatTarget] = useState<SaldoMurid | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const isOrtu = role === "orang_tua";
  const canManage = role ? MANAGE_ROLES.includes(role) : false;

  useEffect(() => {
    let active = true;
    async function load() {
      const meRes = await getJson<MeResult>("/api/auth/me");
      if (!active) return;
      if (!meRes.ok) {
        if (meRes.status === 401) router.replace("/login");
        else {
          setError(meRes.error.message);
          setLoading(false);
        }
        return;
      }

      const currentRole = meRes.data.role;
      setRole(currentRole);
      const ortu = currentRole === "orang_tua";
      if (!ortu && !MANAGE_ROLES.includes(currentRole)) {
        setLoading(false);
        return;
      }

      const [listRes, ringRes] = await Promise.all([
        ortu
          ? getJson<AnakTabungan[]>("/api/tabungan/anak")
          : fetchAllRekap(),
        getJson<RingkasanTabungan>(
          ortu ? "/api/tabungan/anak/ringkasan" : "/api/tabungan/ringkasan",
        ),
      ]);
      if (!active) return;
      if (listRes.ok) {
        setRows(Array.isArray(listRes.data) ? listRes.data : []);
        setError(null);
      } else {
        setError(listRes.error.message);
      }
      if (ringRes.ok) setRingkasan(ringRes.data);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [router, reloadKey]);

  const kelasOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.kelas).filter(Boolean))).sort() as string[],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        (!q || row.nama.toLowerCase().includes(q)) &&
        (kelasFilter === "all" || row.kelas === kelasFilter),
    );
  }, [rows, query, kelasFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  function openDetail(anak: SaldoMurid) {
    const sekolahId = (anak as AnakTabungan).sekolah_id;
    router.push(
      `/panel/tabungan/${anak.murid_id}${sekolahId ? `?sekolah=${sekolahId}` : ""}`,
    );
  }

  function exportCsv() {
    const headers = [
      "Nama Anak",
      "Nama Orang Tua",
      "Kelas",
      ...(isOrtu ? ["Sekolah"] : []),
      "Saldo",
      "Transaksi Terakhir",
    ];
    const data = filtered.map((row) => {
      const last = row.transaksi_terakhir;
      const sekolah = (row as AnakTabungan).sekolah_nama;
      return [
        row.nama,
        row.ortu_nama ?? "",
        row.kelas ?? "",
        ...(isOrtu ? [sekolah ?? ""] : []),
        row.saldo,
        last ? `${last.tanggal} · ${tipeLabel(last.tipe)} ${last.nominal}` : "",
      ];
    });
    downloadCsv(`tabungan-${new Date().toISOString().slice(0, 10)}.csv`, headers, data);
  }

  function reload() {
    setLoading(true);
    setError(null);
    setPage(1);
    setReloadKey((key) => key + 1);
  }

  const colCount = isOrtu ? 8 : 7;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
          <WalletIcon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
            Tabungan Anak
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isOrtu
              ? "Saldo dan riwayat tabungan anak Anda."
              : "Lihat saldo dan riwayat transaksi tabungan setiap anak."}
          </p>
        </div>
      </div>

      {!isOrtu && !canManage && role ? (
        <ErrorText>
          Akun Anda tidak memiliki akses ke data tabungan sekolah.
        </ErrorText>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Saldo
          </p>
          <p className="mt-2 text-2xl font-extrabold text-epaud-navy">
            {loading || !ringkasan ? "…" : rupiah.format(ringkasan.total_saldo)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Debit
          </p>
          <p className="mt-2 text-2xl font-extrabold text-rose-500">
            {loading || !ringkasan ? "…" : rupiah.format(ringkasan.total_tarik)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Penarikan bulan ini</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Kredit
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">
            {loading || !ringkasan ? "…" : rupiah.format(ringkasan.total_setor)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Setoran bulan ini</p>
        </div>
      </div>

      {!isOrtu && canManage ? <TabunganHeatmap /> : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
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
              placeholder="Cari nama anak..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
            />
          </div>
          <select
            value={kelasFilter}
            onChange={(event) => {
              setKelasFilter(event.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:border-epaud-blue"
          >
            <option value="all">Semua kelas</option>
            {kelasOptions.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <DownloadIcon className="size-5 text-slate-400" />
            Export CSV
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Nama Anak</th>
                {isOrtu ? <th className="px-4 py-2">Sekolah</th> : null}
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2">Nama Orang Tua</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Transaksi Terakhir</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Tidak ada data tabungan.
                  </td>
                </tr>
              ) : (
                pageItems.map((anak, index) => {
                  const last = anak.transaksi_terakhir;
                  const sekolahNama = (anak as AnakTabungan).sekolah_nama;
                  return (
                    <tr
                      key={`${(anak as AnakTabungan).sekolah_id ?? "s"}-${anak.murid_id}`}
                      className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                    >
                      <td className="rounded-l-xl px-4 py-3 text-slate-500">
                        {start + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-epaud-blue ring-1 ring-slate-100">
                            {initials(anak.nama)}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {anak.nama}
                          </span>
                        </div>
                      </td>
                      {isOrtu ? (
                        <td className="px-4 py-3 text-slate-500">
                          {sekolahNama ?? "—"}
                        </td>
                      ) : null}
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-epaud-sky px-3 py-1 text-xs font-semibold text-epaud-blue">
                          {anak.kelas || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {anak.ortu_nama || "—"}
                      </td>
                      <td className="px-4 py-3 font-bold text-epaud-navy">
                        {rupiah.format(anak.saldo)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {last ? (
                          <>
                            <span className="block">
                              {formatTanggal(last.tanggal)}
                            </span>
                            <span
                              className={`block text-xs font-semibold ${
                                last.tipe === "tarik"
                                  ? "text-rose-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              {tipeLabel(last.tipe)} {rupiah.format(last.nominal)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="rounded-r-xl px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => setCatatTarget(anak)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-epaud-blue px-3 py-2 text-xs font-semibold text-white transition hover:bg-epaud-blue-dark"
                            >
                              <PlusIcon className="size-4" />
                              Transaksi
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openDetail(anak)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            <MoreIcon className="size-4" />
                            Detail
                          </button>
                        </div>
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
            Menampilkan {totalItems === 0 ? 0 : start + 1} -{" "}
            {Math.min(start + perPage, totalItems)} dari {totalItems} data
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
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
      </div>

      {catatTarget ? (
        <CatatTransaksiModal
          target={catatTarget}
          onClose={() => setCatatTarget(null)}
          onSaved={() => {
            setCatatTarget(null);
            toast.success("Transaksi disimpan.");
            reload();
          }}
        />
      ) : null}
    </div>
  );
}
