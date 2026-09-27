"use client";

import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  MoreIcon,
  SearchIcon,
  WalletIcon,
  XIcon,
} from "@/components/icons";

// ponytail: data contoh (dummy). API tabungan (F4 roadmap) belum ada;
// ganti ke GET /tabungan/rekap + GET /tabungan/murid/{id} saat tersedia.
type TipeTransaksi = "setor" | "tarik";

type Transaksi = {
  id: string;
  tipe: TipeTransaksi;
  nominal: number;
  saldoSetelah: number;
  tanggal: string;
  catatan?: string;
};

type TabunganAnak = {
  id: string;
  nama: string;
  kelas: string;
  transaksi: Transaksi[];
};

type Entry = {
  tipe: TipeTransaksi;
  nominal: number;
  tanggal: string;
  catatan?: string;
};

function riwayat(id: string, entries: Entry[]): Transaksi[] {
  let saldo = 0;
  return entries.map((entry, index) => {
    saldo += entry.tipe === "setor" ? entry.nominal : -entry.nominal;
    return { id: `${id}-${index + 1}`, ...entry, saldoSetelah: saldo };
  });
}

const DUMMY: TabunganAnak[] = [
  {
    id: "1",
    nama: "Andi Pratama",
    kelas: "Kelompok A",
    transaksi: riwayat("1", [
      { tipe: "setor", nominal: 50000, tanggal: "2026-07-08", catatan: "Setoran awal" },
      { tipe: "setor", nominal: 100000, tanggal: "2026-07-22", catatan: "Tabungan mingguan" },
      { tipe: "tarik", nominal: 30000, tanggal: "2026-08-05", catatan: "Beli buku" },
      { tipe: "setor", nominal: 75000, tanggal: "2026-08-19", catatan: "Tabungan mingguan" },
    ]),
  },
  {
    id: "2",
    nama: "Siti Nurhaliza",
    kelas: "Kelompok A",
    transaksi: riwayat("2", [
      { tipe: "setor", nominal: 100000, tanggal: "2026-07-10", catatan: "Setoran awal" },
      { tipe: "setor", nominal: 50000, tanggal: "2026-08-02" },
      { tipe: "tarik", nominal: 25000, tanggal: "2026-08-28", catatan: "Kegiatan outing" },
    ]),
  },
  {
    id: "3",
    nama: "Rizky Maulana",
    kelas: "Kelompok B",
    transaksi: riwayat("3", [
      { tipe: "setor", nominal: 200000, tanggal: "2026-07-05", catatan: "Setoran awal" },
      { tipe: "tarik", nominal: 50000, tanggal: "2026-07-30", catatan: "Seragam" },
      { tipe: "setor", nominal: 50000, tanggal: "2026-09-01" },
    ]),
  },
  {
    id: "4",
    nama: "Dewi Lestari",
    kelas: "Kelompok B",
    transaksi: riwayat("4", [
      { tipe: "setor", nominal: 150000, tanggal: "2026-07-12", catatan: "Setoran awal" },
      { tipe: "setor", nominal: 100000, tanggal: "2026-09-03", catatan: "Tabungan bulanan" },
    ]),
  },
  {
    id: "5",
    nama: "Fahri Ramadhan",
    kelas: "Kelompok C",
    transaksi: riwayat("5", [
      { tipe: "setor", nominal: 50000, tanggal: "2026-07-15" },
      { tipe: "tarik", nominal: 20000, tanggal: "2026-08-11", catatan: "Alat tulis" },
      { tipe: "setor", nominal: 30000, tanggal: "2026-09-09" },
    ]),
  },
  {
    id: "6",
    nama: "Nayla Putri",
    kelas: "Kelompok C",
    transaksi: riwayat("6", [
      { tipe: "setor", nominal: 300000, tanggal: "2026-08-20", catatan: "Setoran awal" },
    ]),
  },
  {
    id: "7",
    nama: "Bagas Prasetya",
    kelas: "Kelompok D",
    transaksi: riwayat("7", [
      { tipe: "setor", nominal: 75000, tanggal: "2026-07-25" },
      { tipe: "tarik", nominal: 10000, tanggal: "2026-09-05", catatan: "Jajan" },
    ]),
  },
  {
    id: "8",
    nama: "Citra Ayu",
    kelas: "Kelompok D",
    transaksi: riwayat("8", [
      { tipe: "setor", nominal: 40000, tanggal: "2026-08-30" },
    ]),
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatTanggal(value: string) {
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

function saldoOf(anak: TabunganAnak) {
  return anak.transaksi.at(-1)?.saldoSetelah ?? 0;
}

export default function TabunganPage() {
  const [query, setQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detail, setDetail] = useState<TabunganAnak | null>(null);

  const kelasOptions = useMemo(
    () => Array.from(new Set(DUMMY.map((anak) => anak.kelas))).sort(),
    [],
  );

  const totalSaldo = useMemo(
    () => DUMMY.reduce((sum, anak) => sum + saldoOf(anak), 0),
    [],
  );
  const totalTransaksi = useMemo(
    () => DUMMY.reduce((sum, anak) => sum + anak.transaksi.length, 0),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUMMY.filter((anak) => {
      const matchQuery = !q || anak.nama.toLowerCase().includes(q);
      const matchKelas = kelasFilter === "all" || anak.kelas === kelasFilter;
      return matchQuery && matchKelas;
    });
  }, [query, kelasFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
          <WalletIcon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
            Tabungan Anak
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lihat saldo dan riwayat transaksi tabungan setiap anak.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Saldo
          </p>
          <p className="mt-2 text-2xl font-extrabold text-epaud-navy">
            {rupiah.format(totalSaldo)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Anak dengan Tabungan
          </p>
          <p className="mt-2 text-2xl font-extrabold text-epaud-navy">
            {DUMMY.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Total Transaksi
          </p>
          <p className="mt-2 text-2xl font-extrabold text-epaud-navy">
            {totalTransaksi}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        {/* Toolbar */}
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
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Nama Anak</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Transaksi Terakhir</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Tidak ada data tabungan.
                  </td>
                </tr>
              ) : (
                pageItems.map((anak, index) => {
                  const last = anak.transaksi.at(-1);
                  return (
                    <tr
                      key={anak.id}
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
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-epaud-sky px-3 py-1 text-xs font-semibold text-epaud-blue">
                          {anak.kelas}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-epaud-navy">
                        {rupiah.format(saldoOf(anak))}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {last ? (
                          <>
                            <span className="block">
                              {formatTanggal(last.tanggal)}
                            </span>
                            <span
                              className={`block text-xs font-semibold ${
                                last.tipe === "setor"
                                  ? "text-emerald-600"
                                  : "text-rose-500"
                              }`}
                            >
                              {last.tipe === "setor" ? "Setor" : "Tarik"}{" "}
                              {rupiah.format(last.nominal)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="rounded-r-xl px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setDetail(anak)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <MoreIcon className="size-4" />
                          Riwayat
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {detail ? (
        <RiwayatModal anak={detail} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}

function RiwayatModal({
  anak,
  onClose,
}: {
  anak: TabunganAnak;
  onClose: () => void;
}) {
  const transaksi = [...anak.transaksi].reverse();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-epaud-sky text-sm font-bold text-epaud-blue">
              {initials(anak.nama)}
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-epaud-navy">
                {anak.nama}
              </h2>
              <p className="text-sm text-slate-500">{anak.kelas}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5">
          <span className="text-sm font-semibold text-slate-600">Saldo saat ini</span>
          <span className="text-2xl font-extrabold text-epaud-navy">
            {rupiah.format(saldoOf(anak))}
          </span>
        </div>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">
          Riwayat Transaksi
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2 text-right">Nominal</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th className="px-4 py-2">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.map((trx) => (
                <tr key={trx.id} className="bg-slate-50/60 text-sm text-slate-700">
                  <td className="rounded-l-xl px-4 py-3 text-slate-500">
                    {formatTanggal(trx.tanggal)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        trx.tipe === "setor"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-500"
                      }`}
                    >
                      {trx.tipe === "setor" ? "Setor" : "Tarik"}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      trx.tipe === "setor" ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {trx.tipe === "setor" ? "+" : "-"}
                    {rupiah.format(trx.nominal)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    {rupiah.format(trx.saldoSetelah)}
                  </td>
                  <td className="rounded-r-xl px-4 py-3 text-slate-500">
                    {trx.catatan || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
