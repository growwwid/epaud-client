"use client";

import { useEffect, useMemo, useState } from "react";
import { getJson, type AkunSekolah } from "./api";
import { inputClass } from "./crud-ui";
import { SearchIcon, XIcon } from "./icons";

/**
 * Autocomplete orang tua (scope sekolah). Memilih data orang tua yang sudah ada
 * (tidak membuat baru) via hidden input `orang_tua_id`. Anak kembar dapat
 * memakai orang tua yang sama.
 */
export function OrangTuaPicker({
  initialNama = "",
  hiddenName = "orang_tua_id",
}: {
  initialNama?: string;
  hiddenName?: string;
}) {
  const [list, setList] = useState<AkunSekolah[]>([]);
  const [query, setQuery] = useState(initialNama);
  const [selectedId, setSelectedId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<AkunSekolah[]>("/api/orang-tua").then((res) => {
      if (active && res.ok) setList(Array.isArray(res.data) ? res.data : []);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list.slice(0, 8);
    return list.filter((o) => o.nama.toLowerCase().includes(q)).slice(0, 8);
  }, [list, query]);

  function pick(o: AkunSekolah) {
    setSelectedId(o.orang_id);
    setQuery(o.nama);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Cari nama orang tua/wali..."
          className={`${inputClass} pl-11 pr-11`}
        />
        {selectedId || query ? (
          <button
            type="button"
            aria-label="Bersihkan"
            onClick={() => {
              setSelectedId("");
              setQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {open && filtered.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white py-1 shadow-2xl shadow-slate-900/10">
          {filtered.map((o) => (
            <li key={o.orang_id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(o)}
                className="flex w-full flex-col items-start px-4 py-2 text-left transition hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-700">{o.nama}</span>
                {o.phone ? (
                  <span className="text-xs text-slate-400">{o.phone}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input type="hidden" name={hiddenName} value={selectedId} />
    </div>
  );
}