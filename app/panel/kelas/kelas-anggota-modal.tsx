"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getJson,
  putJson,
  type Guru,
  type GuruAssignment,
  type Kelas,
  type Murid,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Modal,
} from "@/components/crud-ui";

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

function Avatar({
  nama,
  foto,
  size = "size-12",
}: {
  nama: string;
  foto?: string;
  size?: string;
}) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-epaud-sky text-sm font-bold text-epaud-blue ring-1 ring-slate-100`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={foto} alt={nama} className="size-full object-cover" />
      ) : (
        initials(nama)
      )}
    </span>
  );
}

function PersonCard({
  nama,
  foto,
  info,
  href,
}: {
  nama: string;
  foto?: string;
  info: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      title={info}
      className="flex w-24 flex-col items-center gap-1.5 rounded-xl p-2 text-center transition hover:bg-slate-50"
    >
      <Avatar nama={nama} foto={foto} size="size-14" />
      <span className="line-clamp-2 text-xs font-semibold leading-tight text-slate-700">
        {nama}
      </span>
    </Link>
  );
}

function Dropdown({
  label,
  summary,
  children,
}: {
  label: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="pl-1 text-[13px] font-semibold text-slate-600">{label}</span>
      <details className="group relative">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 marker:content-none">
          {summary}
          <svg viewBox="0 0 24 24" className="size-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-2xl shadow-slate-900/10">
          {children}
        </div>
      </details>
    </div>
  );
}

export function KelasAnggotaModal({
  kelas,
  onClose,
  onSaved,
}: {
  kelas: Kelas;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [guruKelasId, setGuruKelasId] = useState("");
  const [pendampingIds, setPendampingIds] = useState<Set<string>>(new Set());
  const [muridSet, setMuridSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson<Guru[]>("/api/guru"),
      getJson<Murid[]>("/api/murid"),
      getJson<GuruAssignment[]>(`/api/kelas/${kelas.id}/guru`),
      getJson<string[]>(`/api/kelas/${kelas.id}/murid`),
    ]).then(([g, m, assigned, ids]) => {
      if (!active) return;
      if (g.ok) setGuruList(Array.isArray(g.data) ? g.data : []);
      if (m.ok) setMuridList(Array.isArray(m.data) ? m.data : []);
      if (assigned.ok && Array.isArray(assigned.data)) {
        const pend = new Set<string>();
        let kelasID = "";
        assigned.data.forEach((a) => {
          if (a.peran === "guru_kelas") kelasID = a.guru_id;
          else pend.add(a.guru_id);
        });
        setGuruKelasId(kelasID);
        setPendampingIds(pend);
      }
      if (ids.ok && Array.isArray(ids.data)) setMuridSet(new Set(ids.data));
      if (!g.ok && !m.ok) setError("Gagal memuat data anggota kelas.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [kelas.id]);

  const guruKelas = useMemo(
    () => guruList.find((g) => g.id === guruKelasId),
    [guruList, guruKelasId],
  );
  const pendamping = useMemo(
    () => guruList.filter((g) => pendampingIds.has(g.id)),
    [guruList, pendampingIds],
  );
  const muridSelected = useMemo(
    () => muridList.filter((m) => muridSet.has(m.id)),
    [muridList, muridSet],
  );

  function toggle(set: Set<string>, id: string, apply: (next: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  }

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    const guru = [
      ...(guruKelasId ? [{ guru_id: guruKelasId, peran: "guru_kelas" }] : []),
      ...[...pendampingIds].map((guru_id) => ({ guru_id, peran: "guru_pendamping" })),
    ];
    const [resGuru, resMurid] = await Promise.all([
      putJson(`/api/kelas/${kelas.id}/guru`, { guru }),
      putJson(`/api/kelas/${kelas.id}/murid`, { murid_ids: [...muridSet] }),
    ]);
    setSubmitting(false);
    if (resGuru.ok && resMurid.ok) {
      onSaved();
      return;
    }
    setError(
      !resGuru.ok
        ? resGuru.error.message
        : !resMurid.ok
          ? resMurid.error.message
          : "Gagal menyimpan anggota kelas.",
    );
  }

  return (
    <Modal
      wide
      title={`Kelola "${kelas.nama}"`}
      subtitle="Pilih guru kelas, guru pendamping, dan murid."
      onClose={onClose}
    >
      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Memuat data...</p>
      ) : (
        <div className="mt-5 space-y-6">
          {error ? <ErrorText>{error}</ErrorText> : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <Dropdown
              label="Guru Kelas"
              summary={guruKelas?.nama ?? "Belum dipilih"}
            >
              <button
                type="button"
                onClick={() => setGuruKelasId("")}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
              >
                Belum dipilih
              </button>
              {guruList.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGuruKelasId(g.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    g.id === guruKelasId ? "font-bold text-epaud-blue" : "text-slate-700"
                  }`}
                >
                  {g.nama}
                </button>
              ))}
            </Dropdown>

            <Dropdown
              label="Guru Pendamping"
              summary={
                pendamping.length ? `${pendamping.length} guru dipilih` : "Belum dipilih"
              }
            >
              {guruList.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={pendampingIds.has(g.id)}
                    onChange={() => toggle(pendampingIds, g.id, setPendampingIds)}
                    className="size-4 rounded border-slate-300 accent-epaud-blue"
                  />
                  <span className="text-slate-700">{g.nama}</span>
                </label>
              ))}
            </Dropdown>

            <Dropdown
              label="Murid"
              summary={muridSet.size ? `${muridSet.size} murid dipilih` : "Belum dipilih"}
            >
              {muridList.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={muridSet.has(m.id)}
                    onChange={() => toggle(muridSet, m.id, setMuridSet)}
                    className="size-4 rounded border-slate-300 accent-epaud-blue"
                  />
                  <span className="text-slate-700">{m.nama}</span>
                </label>
              ))}
            </Dropdown>
          </div>

          {/* Baris guru: guru kelas + pendamping */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Guru
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500">Guru Kelas</p>
                {guruKelas ? (
                  <PersonCard
                    nama={guruKelas.nama}
                    foto={guruKelas.foto}
                    info={`${guruKelas.nama} · ${guruKelas.jenis === "guru_kelas" ? "Guru Kelas" : "Guru Pendamping"} · ${guruKelas.phone || "tanpa HP"}`}
                    href={`/panel/guru/${guruKelas.id}`}
                  />
                ) : (
                  <p className="text-sm text-slate-400">Belum dipilih.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500">
                  Guru Pendamping
                </p>
                {pendamping.length ? (
                  <div className="flex flex-wrap gap-2">
                    {pendamping.map((g) => (
                      <PersonCard
                        key={g.id}
                        nama={g.nama}
                        foto={g.foto}
                        info={`${g.nama} · Guru Pendamping · ${g.phone || "tanpa HP"}`}
                        href={`/panel/guru/${g.id}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Belum ada.</p>
                )}
              </div>
            </div>
          </section>

          {/* Baris murid: grid maks 3 kolom, rata tengah */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Murid
            </h3>
            {muridSelected.length ? (
              <div className="mx-auto mt-3 grid max-w-sm grid-cols-3 justify-items-center gap-2">
                {muridSelected.map((m) => (
                  <PersonCard
                    key={m.id}
                    nama={m.nama}
                    foto={m.foto}
                    info={`${m.nama} · ${m.status} · NISN ${m.nisn || "-"}`}
                    href={`/panel/murid/${m.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Belum ada murid dipilih.</p>
            )}
          </section>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={buttonGhost}>
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className={buttonPrimary}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}