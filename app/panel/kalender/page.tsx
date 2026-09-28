"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, type KalenderItem } from "@/components/api";
import { Modal, PageHeader, Panel } from "@/components/crud-ui";
import { CalendarIcon, ChevronDownIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { itemDateKey, itemsByDay, monthRange, tipeMeta } from "@/lib/kalender";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function KalenderPage() {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => new Date());
  const [items, setItems] = useState<KalenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });
  const [detail, setDetail] = useState<KalenderItem | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { from, to } = monthRange(year, month);
      const res = await getJson<KalenderItem[]>(`/api/kalender?from=${from}&to=${to}`);
      if (!active) return;
      if (res.ok) setItems(Array.isArray(res.data) ? res.data : []);
      else if (res.status === 401) router.replace("/login");
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [year, month, router]);

  const byDay = useMemo(() => itemsByDay(items), [items]);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayItems = byDay.get(selected) ?? [];

  function shiftMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon className="size-6" />}
        title="Kalender"
        subtitle="Agenda sekolah, event, hari libur, dan ulang tahun anak."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-epaud-navy">
                {MONTHS[month]} {year}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Bulan sebelumnya"
                  onClick={() => shiftMonth(-1)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50"
                >
                  <ChevronDownIcon className="size-4 rotate-90" />
                </button>
                <button
                  type="button"
                  aria-label="Bulan berikutnya"
                  onClick={() => shiftMonth(1)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50"
                >
                  <ChevronDownIcon className="size-4 -rotate-90" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((label) => (
                <span key={label} className="py-1 text-[11px] font-bold uppercase text-slate-400">
                  {label}
                </span>
              ))}
              {Array.from({ length: leading }).map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                const key = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
                const list = byDay.get(key) ?? [];
                const isSelected = selected === key;
                const tooltip =
                  list.length > 0
                    ? list.map((it) => `${tipeMeta(it.tipe).label}: ${it.judul}`).join("\n")
                    : undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    title={tooltip}
                    onClick={() => setSelected(key)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm font-semibold transition ${
                      isSelected
                        ? "bg-epaud-blue text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {dayNum}
                    {list.length > 0 ? (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {list.slice(0, 3).map((it, idx) => (
                          <span
                            key={idx}
                            className={`size-1.5 rounded-full ${isSelected ? "bg-white" : tipeMeta(it.tipe).dot}`}
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            {tanggalPanjang.format(new Date(`${selected}T00:00:00`))}
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Memuat…</p>
          ) : dayItems.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
              Tidak ada agenda pada tanggal ini.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dayItems.map((it) => {
                const meta = tipeMeta(it.tipe);
                return (
                  <li key={`${it.tipe}-${it.id}`}>
                    <button
                      type="button"
                      onClick={() => setDetail(it)}
                      className="flex w-full items-start gap-3 rounded-xl bg-slate-50/70 p-4 text-left transition hover:bg-slate-100"
                    >
                      <span className={`mt-1 size-2.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">{it.judul}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                            {meta.label}
                          </span>
                        </span>
                        {!it.all_day ? (
                          <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                            <ClockIcon className="size-3.5" />
                            {jam.format(new Date(it.mulai))}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {detail ? <ItemDetail item={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function ItemDetail({ item, onClose }: { item: KalenderItem; onClose: () => void }) {
  const meta = tipeMeta(item.tipe);
  return (
    <Modal
      title={item.judul}
      subtitle={tanggalPanjang.format(new Date(`${itemDateKey(item)}T00:00:00`))}
      onClose={onClose}
    >
      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
          {meta.label}
        </span>
        {item.deskripsi ? <p>{item.deskripsi}</p> : null}
        <div className="space-y-1.5 text-xs text-slate-400">
          <p className="flex items-center gap-1.5">
            <ClockIcon className="size-4" />
            {item.all_day ? "Sepanjang hari" : jam.format(new Date(item.mulai))}
          </p>
          {item.lokasi ? (
            <p className="flex items-center gap-1.5">
              <MapPinIcon className="size-4" />
              {item.lokasi}
            </p>
          ) : null}
          {item.murid ? (
            <p>
              Murid: <span className="font-semibold text-slate-600">{item.murid.nama}</span>
              {item.murid.kelas ? ` · ${item.murid.kelas}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}