"use client";

import { useState } from "react";
import { TahunAjaranForm } from "@/components/tahun-ajaran-form";
import { useTahunAjaran } from "./tahun-ajaran-context";

const ADD_VALUE = "__add__";

const SEMESTER_LABEL: Record<string, string> = {
  ganjil: "Ganjil",
  genap: "Genap",
};

export function TahunAjaranSelect() {
  const { list, selectedId, setSelectedId, reload } = useTahunAjaran();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="px-3 pb-1">
      <span className="block px-1 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        Tahun Akademik
      </span>
      <select
        value={selectedId}
        onChange={(event) => {
          const value = event.target.value;
          if (value === ADD_VALUE) {
            event.target.value = selectedId;
            setAddOpen(true);
            return;
          }
          setSelectedId(value);
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
      >
        {list.length === 0 ? (
          <option value="">Belum ada tahun ajaran</option>
        ) : null}
        {list.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nama} · {SEMESTER_LABEL[item.semester] ?? item.semester}
            {item.is_active ? " (Aktif)" : ""}
          </option>
        ))}
        <option value={ADD_VALUE}>＋ Tambah tahun ajaran…</option>
      </select>

      {addOpen ? (
        <TahunAjaranForm
          onClose={() => setAddOpen(false)}
          onSaved={async (item) => {
            setAddOpen(false);
            await reload();
            setSelectedId(item.id);
          }}
        />
      ) : null}
    </div>
  );
}
