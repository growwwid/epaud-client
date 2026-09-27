"use client";

import { useMemo, useState } from "react";
import type { Event } from "./api";
import { ChevronDownIcon } from "./icons";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function dateKey(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function eventsByDay(events: Event[]) {
  const map = new Map<string, Event[]>();
  for (const event of events) {
    const key = dateKey(event.tanggal_mulai);
    const list = map.get(key);
    if (list) list.push(event);
    else map.set(key, [event]);
  }
  return map;
}

export function MiniCalendar({
  events,
  selectedDate,
  onSelectDate,
}: {
  events: Event[];
  selectedDate?: string;
  onSelectDate?: (key: string) => void;
}) {
  const [cursor, setCursor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedDate ?? internalSelected;

  const byDay = useMemo(() => eventsByDay(events), [events]);
  const todayKey = dateKey(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;

  function shiftMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
  }

  function select(key: string) {
    setInternalSelected(key);
    onSelectDate?.(key);
  }

  return (
    <div>
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
          <span
            key={label}
            className="py-1 text-[11px] font-bold uppercase text-slate-400"
          >
            {label}
          </span>
        ))}

        {Array.from({ length: leading }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
          const key = dateKey(new Date(year, month, dayNum));
          const hasEvent = byDay.has(key);
          const isSelected = selected === key;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition ${
                isSelected
                  ? "bg-epaud-blue text-white"
                  : isToday
                    ? "bg-epaud-sky text-epaud-blue"
                    : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {dayNum}
              {hasEvent ? (
                <span
                  className={`absolute bottom-1 size-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-epaud-blue"
                  }`}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
