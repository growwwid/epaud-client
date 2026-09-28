"use client";

import { useEffect, useMemo, useState } from "react";
import { getJson } from "@/components/api";
import { ErrorText } from "@/components/crud-ui";
import { ChevronDownIcon } from "@/components/icons";

type HeatmapHari = {
  tanggal: string;
  murid_setor: number;
  nominal_setor: number;
};

type TabunganHeatmapData = {
  bulan: string;
  total_murid_aktif: number;
  hari: HeatmapHari[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function shiftBulan(bulan: string, delta: number) {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function bulanLabel(bulan: string) {
  const [y, m] = bulan.split("-").map(Number);
  return `${MONTHS[m - 1] ?? bulan} ${y}`;
}

const LEVEL_CLASS = [
  "bg-slate-100",
  "bg-emerald-100",
  "bg-emerald-300",
  "bg-emerald-500",
  "bg-emerald-700",
];

/**
 * Heatmap retensi menabung (gaya kontribusi GitHub): satu sel per hari pada
 * bulan terpilih, intensitas = rasio murid aktif yang menyetor hari itu.
 */
export function TabunganHeatmap() {
  const [bulan, setBulan] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<TabunganHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await getJson<TabunganHeatmapData>(`/api/tabungan/heatmap?bulan=${bulan}`);
      if (!active) return;
      if (res.ok) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error.message);
        setData(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [bulan]);

  const cells = useMemo(() => {
    if (!data) return [];
    const byDay = new Map(data.hari.map((h) => [h.tanggal, h]));
    const [y, m] = data.bulan.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Senin = 0
    const out: Array<{ tanggal?: string; hari?: HeatmapHari }> = [];
    for (let i = 0; i < offset; i += 1) out.push({});
    for (let d = 1; d <= daysInMonth; d += 1) {
      const tanggal = `${data.bulan}-${String(d).padStart(2, "0")}`;
      out.push({ tanggal, hari: byDay.get(tanggal) });
    }
    return out;
  }, [data]);

  const totalSetor = useMemo(
    () => (data?.hari ?? []).reduce((sum, h) => sum + h.nominal_setor, 0),
    [data],
  );

  function level(hari?: HeatmapHari) {
    if (!hari || !data || data.total_murid_aktif === 0) return 0;
    const rasio = hari.murid_setor / data.total_murid_aktif;
    if (rasio >= 0.75) return 4;
    if (rasio >= 0.5) return 3;
    if (rasio >= 0.25) return 2;
    return 1;
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Retensi Menabung
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {loading || !data
              ? "Memuat…"
              : `${totalSetor > 0 ? rupiah.format(totalSetor) : "Belum ada setoran"} · ${data.total_murid_aktif} murid aktif`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setBulan((b) => shiftBulan(b, -1))}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronDownIcon className="size-4 rotate-90" />
          </button>
          <span className="min-w-24 text-center text-sm font-bold text-epaud-navy">
            {bulanLabel(bulan)}
          </span>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setBulan((b) => shiftBulan(b, 1))}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronDownIcon className="size-4 -rotate-90" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4">
          <ErrorText>{error}</ErrorText>
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-max grid-flow-col grid-rows-7 gap-1">
          {cells.map((cell, index) =>
            cell.tanggal ? (
              <div
                key={cell.tanggal}
                title={
                  cell.hari
                    ? `${cell.tanggal} · ${cell.hari.murid_setor} murid setor · ${rupiah.format(cell.hari.nominal_setor)}`
                    : `${cell.tanggal} · tidak ada setoran`
                }
                className={`size-4 rounded-sm sm:size-5 ${LEVEL_CLASS[level(cell.hari)]}`}
              />
            ) : (
              <div key={`empty-${index}`} className="size-4 sm:size-5" />
            ),
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <span>Sedikit</span>
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={`size-3 rounded-sm ${cls}`} />
        ))}
        <span>Banyak</span>
      </div>
    </div>
  );
}