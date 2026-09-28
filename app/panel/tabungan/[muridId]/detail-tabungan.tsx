"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getEnvelope,
  getJson,
  type AnakTabungan,
  type MeResult,
  type SaldoMurid,
  type Transaksi,
  type TransaksiList,
} from "@/components/api";
import { downloadCsv } from "@/components/csv";
import { CatatTransaksiModal } from "@/components/catat-transaksi-modal";
import { ErrorText } from "@/components/crud-ui";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  DownloadIcon,
  PlusIcon,
} from "@/components/icons";

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

function tipeLabel(tipe: string) {
  if (tipe === "setor") return "Kredit (Setor)";
  if (tipe === "tarik") return "Debit (Tarik)";
  return "Penyesuaian";
}

const TIPE_OPTIONS = [
  { value: "all", label: "Semua tipe" },
  { value: "setor", label: "Kredit (Setoran)" },
  { value: "tarik", label: "Debit (Penarikan)" },
  { value: "penyesuaian", label: "Penyesuaian" },
];

export function DetailTabungan({
  muridId,
  sekolahId,
}: {
  muridId: string;
  sekolahId?: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [anak, setAnak] = useState<SaldoMurid | null>(null);
  const [sekolahNama, setSekolahNama] = useState<string | null>(null);
  const [items, setItems] = useState<Transaksi[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingAnak, setLoadingAnak] = useState(true);
  const [loadingTrx, setLoadingTrx] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catatOpen, setCatatOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [tipe, setTipe] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const isOrtu = role === "orang_tua";
  const canManage = role === "kepala_sekolah" || role === "admin_sekolah";
  const bisaCatat = canManage && anak?.status === "aktif";
  const base = muridId
    ? isOrtu
      ? sekolahId
        ? `/api/tabungan/anak/${sekolahId}/murid/${muridId}/transaksi`
        : null
      : `/api/tabungan/murid/${muridId}/transaksi`
    : null;

  useEffect(() => {
    let active = true;
    async function load() {
      const meRes = await getJson<MeResult>("/api/auth/me");
      if (!active) return;
      if (!meRes.ok) {
        if (meRes.status === 401) router.replace("/login");
        else {
          setError(meRes.error.message);
          setLoadingAnak(false);
        }
        return;
      }

      const ortu = meRes.data.role === "orang_tua";
      setRole(meRes.data.role);

      if (ortu) {
        if (!sekolahId) {
          setError("Data sekolah tidak ditemukan.");
          setLoadingAnak(false);
          setLoadingTrx(false);
          return;
        }
        const [saldoRes, anakRes] = await Promise.all([
          getJson<SaldoMurid>(
            `/api/tabungan/anak/${sekolahId}/murid/${muridId}`,
          ),
          getJson<AnakTabungan[]>("/api/tabungan/anak"),
        ]);
        if (!active) return;
        if (saldoRes.ok) setAnak(saldoRes.data);
        else setError(saldoRes.error.message);
        if (anakRes.ok) {
          const found = (Array.isArray(anakRes.data) ? anakRes.data : []).find(
            (a) => a.murid_id === muridId && a.sekolah_id === sekolahId,
          );
          if (found?.sekolah_nama) setSekolahNama(found.sekolah_nama);
        }
      } else {
        const saldoRes = await getJson<SaldoMurid>(`/api/tabungan/murid/${muridId}`);
        if (!active) return;
        if (saldoRes.ok) setAnak(saldoRes.data);
        else setError(saldoRes.error.message);
        setSekolahNama(meRes.data.nama_sekolah);
      }
      setLoadingAnak(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [router, muridId, sekolahId, reloadKey]);

  useEffect(() => {
    if (!role || !base) return;
    let active = true;

    async function load() {
      setLoadingTrx(true);
      const qs = new URLSearchParams({
        page: String(page),
        size: String(perPage),
      });
      if (dari) qs.set("dari", dari);
      if (sampai) qs.set("sampai", sampai);
      if (tipe !== "all") qs.set("tipe", tipe);

      const res = await getEnvelope<TransaksiList>(`${base}?${qs}`);
      if (!active) return;
      if (res.ok) {
        setItems(res.data.data ?? []);
        setTotal(res.data.meta?.total ?? 0);
        setError(null);
      } else {
        setError(res.error.message);
        setItems([]);
      }
      setLoadingTrx(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [role, base, dari, sampai, tipe, page, muridId, sekolahId, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);

  function resetFilter(setter: () => void) {
    setter();
    setPage(1);
  }

  async function exportCsv() {
    if (!base) return;
    const all: Transaksi[] = [];
    for (let p = 1; ; p += 1) {
      const qs = new URLSearchParams({ page: String(p), size: "100" });
      if (dari) qs.set("dari", dari);
      if (sampai) qs.set("sampai", sampai);
      if (tipe !== "all") qs.set("tipe", tipe);
      const res = await getEnvelope<TransaksiList>(`${base}?${qs}`);
      if (!res.ok) break;
      const batch = res.data.data ?? [];
      all.push(...batch);
      const count = res.data.meta?.total ?? all.length;
      if (batch.length === 0 || all.length >= count) break;
    }
    downloadCsv(
      `transaksi-${anak?.nama ?? muridId}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Tanggal", "Tipe", "Nominal", "Saldo Setelah", "Catatan"],
      all.map((trx) => [
        trx.tanggal,
        tipeLabel(trx.tipe),
        trx.nominal,
        trx.saldo_setelah,
        trx.catatan ?? "",
      ]),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/panel/tabungan"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-epaud-blue"
        >
          <ArrowRightIcon className="size-4 rotate-180" />
          Kembali ke Tabungan
        </Link>
        {bisaCatat && anak ? (
          <button
            type="button"
            onClick={() => setCatatOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            <PlusIcon className="size-4" />
            Catat Transaksi
          </button>
        ) : null}
      </div>

      {error ? <ErrorText>{error}</ErrorText> : null}

      {/* Kartu saldo bergaya kartu kredit */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-epaud-navy via-epaud-blue to-epaud-blue-dark p-6 text-white shadow-xl shadow-epaud-blue/25 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 size-52 rounded-full bg-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-10 size-44 rounded-full bg-white/5"
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/95 shadow-sm">
              <Image
                src="/epaud-logo.png"
                alt="Logo ePAUD"
                width={1347}
                height={1167}
                className="h-8 w-auto"
              />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">
                {sekolahNama || "ePAUD"}
              </p>
              <p className="text-[11px] uppercase tracking-widest text-white/60">
                Kartu Tabungan
              </p>
            </div>
          </div>
          <p className="text-right text-[11px] uppercase tracking-widest text-white/60">
            Saldo
          </p>
        </div>

        <p className="relative mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {loadingAnak || !anak ? "…" : rupiah.format(anak.saldo)}
        </p>

        <div className="relative mt-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/60">
              Nama Lengkap
            </p>
            <p className="text-lg font-bold">
              {loadingAnak ? "…" : anak?.nama ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-white/60">
              Kelas
            </p>
            <p className="font-semibold">{anak?.kelas || "—"}</p>
          </div>
        </div>
      </div>

      {/* Riwayat transaksi */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[13px] font-semibold text-slate-600">
              Dari tanggal
            </span>
            <input
              type="date"
              value={dari}
              onChange={(event) => resetFilter(() => setDari(event.target.value))}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[13px] font-semibold text-slate-600">
              Sampai tanggal
            </span>
            <input
              type="date"
              value={sampai}
              onChange={(event) => resetFilter(() => setSampai(event.target.value))}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[13px] font-semibold text-slate-600">
              Tipe
            </span>
            <select
              value={tipe}
              onChange={(event) => resetFilter(() => setTipe(event.target.value))}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:border-epaud-blue"
            >
              {TIPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!items || items.length === 0}
            className="ml-auto flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <DownloadIcon className="size-5 text-slate-400" />
            Export CSV
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-separate border-spacing-y-2 text-left">
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
              {loadingTrx ? (
                <tr>
                  <td
                    colSpan={5}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Memuat transaksi...
                  </td>
                </tr>
              ) : !items || items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : (
                items.map((trx) => (
                  <tr key={trx.id} className="bg-slate-50/60 text-sm text-slate-700">
                    <td className="rounded-l-xl px-4 py-3 text-slate-500">
                      {formatTanggal(trx.tanggal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          trx.tipe === "tarik"
                            ? "bg-rose-50 text-rose-500"
                            : trx.tipe === "penyesuaian"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {tipeLabel(trx.tipe)}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        trx.tipe === "tarik"
                          ? "text-rose-500"
                          : trx.tipe === "penyesuaian"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {trx.tipe === "tarik" ? "-" : trx.tipe === "setor" ? "+" : ""}
                      {rupiah.format(Math.abs(trx.nominal))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {rupiah.format(trx.saldo_setelah)}
                    </td>
                    <td className="rounded-r-xl px-4 py-3 text-slate-500">
                      {trx.catatan || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Menampilkan {total === 0 ? 0 : (currentPage - 1) * perPage + 1} -{" "}
            {Math.min(currentPage * perPage, total)} dari {total} transaksi
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronDownIcon className="size-4 rotate-90" />
            </button>
            <span className="px-2 text-sm font-semibold text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
              className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronDownIcon className="size-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {catatOpen && anak ? (
        <CatatTransaksiModal
          target={anak}
          onClose={() => setCatatOpen(false)}
          onSaved={() => {
            setCatatOpen(false);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
    </div>
  );
}
