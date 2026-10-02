"use client";

import { useEffect, useMemo, useState } from "react";
import { getJson } from "@/components/api";
import { ErrorText } from "@/components/crud-ui";

type HeatmapHari = {
  tanggal: string;
  murid_setor: number;
  nominal_setor: number;
};

type TabunganHeatmapData = {
  tahun: string;
  hari: HeatmapHari[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAY_LABELS: Record<number, string> = { 0: "Mon", 1: "Wed", 2: "Fri" };

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Format tanggal lokal (hindari pergeseran zona waktu dari toISOString). */
function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const LEVEL_CLASS = [
  "bg-slate-100",
  "bg-emerald-200",
  "bg-emerald-400",
  "bg-emerald-600",
  "bg-emerald-800",
];

/**
 * Heatmap retensi menabung (gaya kontribusi GitHub): satu kolom per pekan
 * sepanjang tahun terpilih, satu baris per hari, intensitas = jumlah murid
 * yang menyetor hari itu.
 */
export function TabunganHeatmap() {
  const [tahun, setTahun] = useState(() => String(new Date().getFullYear()));
  const [data, setData] = useState<TabunganHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const res = await getJson<TabunganHeatmapData>(`/api/tabungan/heatmap?tahun=${tahun}`);
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
  }, [tahun]);

  const { weeks, monthTicks, max, totalMurid, totalSetor, totalHari } = useMemo(() => {
    const empty = {
      weeks: [] as Array<Array<{ key: string; hari?: HeatmapHari } | null>>,
      monthTicks: [] as Array<{ col: number; label: string }>,
      max: 0,
      totalMurid: 0,
      totalSetor: 0,
      totalHari: 0,
    };
    if (!data) return empty;
    const byDay = new Map(data.hari.map((h) => [h.tanggal, h]));
    const y = Number(data.tahun);
    const jan1 = new Date(y, 0, 1);
    const offset = (jan1.getDay() + 6) % 7; // Senin = 0
    const start = new Date(y, 0, 1 - offset);
    const end = new Date(y, 11, 31);

    const out: Array<Array<{ key: string; hari?: HeatmapHari } | null>> = [];
    const ticks: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const di = (d.getDay() + 6) % 7;
      if (di === 0) {
        out.push([null, null, null, null, null, null, null]);
        if (d.getMonth() !== lastMonth && d.getFullYear() === y) {
          lastMonth = d.getMonth();
          ticks.push({ col: out.length - 1, label: MONTHS[d.getMonth()] });
        }
      }
      if (d.getFullYear() !== y) continue;
      const key = toKey(d);
      out[out.length - 1][di] = { key, hari: byDay.get(key) };
    }

    let maxN = 0;
    let murid = 0;
    let nominal = 0;
    for (const h of data.hari) {
      maxN = Math.max(maxN, h.murid_setor);
      murid += h.murid_setor;
      nominal += h.nominal_setor;
    }
    return {
      weeks: out,
      monthTicks: ticks,
      max: maxN,
      totalMurid: murid,
      totalSetor: nominal,
      totalHari: data.hari.length,
    };
  }, [data]);

  function level(hari?: HeatmapHari) {
    if (!hari || max === 0) return 0;
    const r = hari.murid_setor / max;
    if (r >= 0.75) return 4;
    if (r >= 0.5) return 3;
    if (r >= 0.25) return 2;
    return 1;
  }

  const years: string[] = [];
  const thisYear = new Date().getFullYear();
  for (let y = thisYear; y >= thisYear - 6; y -= 1) years.push(String(y));

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-600">
            {loading || !data ? (
              "Memuat…"
            ) : (
              <>
                <span className="font-bold text-epaud-navy">{totalMurid}</span> setoran pada{" "}
                <span className="font-bold text-epaud-navy">{totalHari}</span> hari di tahun{" "}
                {tahun}
                {totalSetor > 0 ? ` · ${rupiah.format(totalSetor)}` : ""}
              </>
            )}
          </p>

          {error ? (
            <div className="mt-3">
              <ErrorText>{error}</ErrorText>
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto pb-1">
            <div className="min-w-max">
              <div className="flex">
                <div className="mr-2 flex flex-col justify-between py-px text-[10px] text-slate-400">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="flex h-[14px] items-center">
                      {DAY_LABELS[i]}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-[3px]">
                    {monthTicks.map((t) => (
                      <span
                        key={t.label + t.col}
                        style={{ gridColumn: t.col }}
                        className="w-0 overflow-visible whitespace-nowrap text-[10px] text-slate-400"
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-[3px]">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((cell, di) =>
                          cell ? (
                            <div
                              key={cell.key}
                              title={
                                cell.hari
                                  ? `${cell.key} · ${cell.hari.murid_setor} murid setor · ${rupiah.format(cell.hari.nominal_setor)}`
                                  : `${cell.key} · tidak ada setoran`
                              }
                              className={`size-[11px] rounded-[2px] ${LEVEL_CLASS[level(cell.hari)]}`}
                            />
                          ) : (
                            <div key={`${wi}-${di}`} className="size-[11px] rounded-[2px] bg-transparent" />
                          ),
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-400">
            <span>Sedikit</span>
            {LEVEL_CLASS.map((cls) => (
              <span key={cls} className={`size-[11px] rounded-[2px] ${cls}`} />
            ))}
            <span>Banyak</span>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-row flex-wrap gap-1 sm:w-32 sm:flex-col">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setTahun(y)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:text-left ${
                y === tahun
                  ? "bg-epaud-blue text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
