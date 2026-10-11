"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getJson,
  postJson,
  type LanggananRingkasan,
  type Paket,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  PageHeader,
  Panel,
} from "@/components/crud-ui";
import { CheckIcon, StarIcon, WalletIcon } from "@/components/icons";

const STATUS_LABEL: Record<string, string> = {
  free: "Gratis",
  trial: "Uji Coba",
  active: "Aktif",
  expired: "Kedaluwarsa",
  suspended: "Ditangguhkan",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function LanggananPage() {
  const [data, setData] = useState<LanggananRingkasan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getJson<LanggananRingkasan>("/api/langganan").then((res) => {
      if (res.ok) setData(res.data);
      else setError(res.error.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function pilih(paket: Paket) {
    if (paket.kode === data?.langganan.paket_kode) return;
    setBusy(paket.kode);
    setError(null);
    const res = await postJson("/api/langganan", { paket_kode: paket.kode });
    setBusy(null);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    toast.success(`Paket ${paket.nama} berhasil dipilih.`);
    load();
  }

  if (loading || !data) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={<WalletIcon className="size-6" />}
          title="Langganan"
          subtitle="Kelola paket langganan sekolah."
        />
        <Panel>{error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-slate-400">Memuat…</p>}</Panel>
      </div>
    );
  }

  const { langganan, paket } = data;
  const terkunci = langganan.paket_kode;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<WalletIcon className="size-6" />}
        title="Langganan"
        subtitle="Kelola paket langganan sekolah."
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Paket saat ini: {langganan.paket_nama || "Gratis"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Status: {STATUS_LABEL[langganan.status] ?? langganan.status}
              {langganan.tanggal_berakhir
                ? ` · berlaku sampai ${tanggal.format(new Date(langganan.tanggal_berakhir))}`
                : ""}
            </p>
          </div>
          <span className="rounded-full bg-epaud-sky px-3 py-1 text-xs font-bold text-epaud-blue">
            {STATUS_LABEL[langganan.status] ?? langganan.status}
          </span>
        </div>
      </Panel>

      {error ? <ErrorText>{error}</ErrorText> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paket.map((p) => {
          const current = p.kode === terkunci;
          const unggulan = p.kode === "pro";
          return (
            <div
              key={p.kode}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                unggulan ? "border-epaud-blue" : "border-slate-100"
              }`}
            >
              {unggulan ? (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-epaud-sky px-2.5 py-0.5 text-[11px] font-bold text-epaud-blue">
                  <StarIcon className="size-3.5" />
                  Populer
                </span>
              ) : null}
              <h3 className="text-lg font-extrabold text-epaud-navy">{p.nama}</h3>
              <p className="mt-1 text-2xl font-extrabold text-slate-800">
                {p.harga === 0 ? "Gratis" : rupiah.format(p.harga)}
                {p.harga === 0 ? null : (
                  <span className="text-sm font-medium text-slate-400">/bulan</span>
                )}
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-emerald-500" />
                  Fitur inti (master, tabungan, absensi)
                </li>
                {p.kode !== "gratis" ? (
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4 text-emerald-500" />
                    Laporan & analitik
                  </li>
                ) : null}
                {p.kode === "pro" ? (
                  <li className="flex items-center gap-2">
                    <CheckIcon className="size-4 text-emerald-500" />
                    Notifikasi WhatsApp & branding
                  </li>
                ) : null}
              </ul>
              <button
                type="button"
                onClick={() => pilih(p)}
                disabled={current || busy === p.kode}
                className={`mt-5 h-11 rounded-xl text-sm font-bold transition ${
                  current
                    ? "cursor-default bg-slate-100 text-slate-400"
                    : unggulan
                      ? buttonPrimary
                      : buttonGhost
                }`}
              >
                {current
                  ? "Paket Aktif"
                  : busy === p.kode
                    ? "Memproses…"
                    : p.kode === "gratis"
                      ? "Gunakan Gratis"
                      : "Mulai Uji Coba"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Fitur inti tetap gratis. Paket berbayar saat ini diberikan sebagai uji
        coba {`14`} hari (gerbang pembayaran menyusul).
      </p>
    </div>
  );
}
