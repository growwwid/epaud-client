"use client";

import { useMemo, useState } from "react";
import { MiniCalendar, dateKey, eventsByDay } from "@/components/mini-calendar";
import { PageHeader, Panel } from "@/components/crud-ui";
import { DUMMY_EVENTS } from "@/components/dummy-data";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import type { Event } from "@/components/api";

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jam = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

function parseKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function EventRow({ event }: { event: Event }) {
  return (
    <li className="flex items-start gap-4 rounded-xl bg-slate-50/70 p-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-epaud-blue ring-1 ring-slate-100">
        <CalendarIcon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-slate-800">{event.judul}</p>
        {event.deskripsi ? (
          <p className="mt-0.5 text-sm text-slate-500">{event.deskripsi}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="size-3.5" />
            {event.all_day
              ? "Sepanjang hari"
              : jam.format(new Date(event.tanggal_mulai))}
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
}

export default function KalenderPage() {
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));

  const byDay = useMemo(() => eventsByDay(DUMMY_EVENTS), []);
  const dayEvents = byDay.get(selectedKey) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon className="size-6" />}
        title="Kalender"
        subtitle="Kalender agenda sekolah. Data contoh sampai API event tersedia."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <MiniCalendar
              events={DUMMY_EVENTS}
              selectedDate={selectedKey}
              onSelectDate={setSelectedKey}
            />
          </Panel>
        </div>

        <Panel>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            {tanggalPanjang.format(parseKey(selectedKey))}
          </h2>
          {dayEvents.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
              Tidak ada event pada tanggal ini.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dayEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
