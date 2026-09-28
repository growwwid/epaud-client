"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  putJson,
  type ApiResult,
  type Guru,
  type GuruAssignment,
  type Kelas,
  type Murid,
  type TahunAjaran,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  EmptyRow,
  ErrorText,
  Field,
  inputClass,
  Modal,
  Notice,
  OptionalFields,
  PageHeader,
  Panel,
  tableHeadClass,
} from "@/components/crud-ui";
import { GridIcon, PlusIcon } from "@/components/icons";

export default function KelasPage() {
  const router = useRouter();
  const [items, setItems] = useState<Kelas[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [taFilter, setTaFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kelas | null>(null);
  const [managing, setManaging] = useState<Kelas | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const taName = useCallback(
    (id: string) => tahunAjaran.find((ta) => ta.id === id)?.nama ?? "—",
    [tahunAjaran],
  );

  const apply = useCallback(
    (res: ApiResult<Kelas[]>) => {
      if (res.ok) {
        setItems(Array.isArray(res.data) ? res.data : []);
        setError(null);
      } else {
        setError(res.error.message);
        if (res.status === 401) router.replace("/login");
      }
      setLoading(false);
    },
    [router],
  );

  const load = useCallback(
    (taId: string) => {
      const path = taId === "all" ? "/api/kelas" : `/api/kelas?tahun_ajaran_id=${taId}`;
      getJson<Kelas[]>(path).then(apply);
    },
    [apply],
  );

  useEffect(() => {
    getJson<TahunAjaran[]>("/api/tahun-ajaran").then((res) => {
      if (res.ok) setTahunAjaran(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  useEffect(() => {
    load(taFilter);
  }, [taFilter, load]);

  function reload() {
    setLoading(true);
    load(taFilter);
  }

  async function remove(item: Kelas) {
    if (!window.confirm(`Hapus kelas "${item.nama}"?`)) return;
    setBusyId(item.id);
    setError(null);
    const res = await deleteJson(`/api/kelas/${item.id}`);
    setBusyId(null);
    if (res.ok) {
      setNotice(`Kelas "${item.nama}" dihapus.`);
      reload();
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<GridIcon className="size-6" />}
        title="Kelas"
        subtitle="Kelola kelas, penugasan guru, dan anggota murid."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={taFilter}
            onChange={(event) => setTaFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:border-epaud-blue"
          >
            <option value="all">Semua tahun ajaran</option>
            {tahunAjaran.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama} — {ta.semester}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="ml-auto flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            <PlusIcon className="size-5" />
            Tambah Kelas
          </button>
        </div>

        {error ? (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4">
            <Notice onClose={() => setNotice(null)}>{notice}</Notice>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Nama Kelas</th>
                <th className="px-4 py-2">Tingkat</th>
                <th className="px-4 py-2">Tahun Ajaran</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={5} label="Memuat data..." />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={5} label="Tidak ada data kelas." />
              ) : (
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                  >
                    <td className="rounded-l-xl px-4 py-3 text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.tingkat || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {taName(item.tahun_ajaran_id)}
                    </td>
                    <td className="rounded-r-xl px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setManaging(item)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-epaud-blue transition hover:bg-slate-50"
                        >
                          Kelola
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(item)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          disabled={busyId === item.id}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {formOpen ? (
        <KelasForm
          tahunAjaran={tahunAjaran}
          onTahunAjaranCreated={(ta) => setTahunAjaran((prev) => [...prev, ta])}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice("Kelas ditambahkan.");
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <KelasForm
          item={editing}
          tahunAjaran={tahunAjaran}
          onTahunAjaranCreated={(ta) => setTahunAjaran((prev) => [...prev, ta])}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Kelas diperbarui.");
            reload();
          }}
        />
      ) : null}

      {managing ? (
        <KelasAnggotaModal
          kelas={managing}
          onClose={() => setManaging(null)}
          onSaved={() => {
            setManaging(null);
            setNotice(`Anggota kelas "${managing.nama}" disimpan.`);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function KelasForm({
  item,
  tahunAjaran,
  onTahunAjaranCreated,
  onClose,
  onSaved,
}: {
  item?: Kelas;
  tahunAjaran: TahunAjaran[];
  onTahunAjaranCreated: (ta: TahunAjaran) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(item);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taId, setTaId] = useState(item?.tahun_ajaran_id ?? "");
  const [showNewTa, setShowNewTa] = useState(false);
  const [creatingTa, setCreatingTa] = useState(false);
  const [taError, setTaError] = useState<string | null>(null);
  const [newTaNama, setNewTaNama] = useState("");
  const [newTaSemester, setNewTaSemester] = useState("ganjil");

  async function createTahunAjaran() {
    const nama = newTaNama.trim();
    if (!nama) {
      setTaError("Nama tahun ajaran wajib diisi.");
      return;
    }
    setTaError(null);
    setCreatingTa(true);
    const res = await postJson<TahunAjaran>("/api/tahun-ajaran", {
      nama,
      semester: newTaSemester,
    });
    setCreatingTa(false);
    if (!res.ok) {
      setTaError(res.error.message);
      return;
    }
    onTahunAjaranCreated(res.data);
    setTaId(res.data.id);
    setShowNewTa(false);
    setNewTaNama("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      tahun_ajaran_id: taId,
      nama: String(data.get("nama") ?? "").trim(),
      tingkat: String(data.get("tingkat") ?? "").trim(),
    };
    if (!payload.tahun_ajaran_id) {
      setError("Tahun ajaran wajib dipilih.");
      return;
    }
    if (!payload.nama) {
      setError("Nama kelas wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = item
      ? await patchJson<Kelas>(`/api/kelas/${item.id}`, payload)
      : await postJson<Kelas>("/api/kelas", payload);
    setSubmitting(false);
    if (res.ok) onSaved();
    else setError(res.error.message);
  }

  return (
    <Modal
      title={editing ? "Edit Kelas" : "Tambah Kelas"}
      subtitle="Kelas terikat pada satu tahun ajaran."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Tahun Ajaran *">
          <div className="space-y-2">
            <select
              name="tahun_ajaran_id"
              className={inputClass}
              value={taId}
              onChange={(event) => setTaId(event.target.value)}
            >
              <option value="">Pilih tahun ajaran</option>
              {tahunAjaran.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} — {ta.semester}
                </option>
              ))}
            </select>

            {showNewTa ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={newTaNama}
                    onChange={(event) => setNewTaNama(event.target.value)}
                    placeholder="2026/2027"
                    className={inputClass}
                  />
                  <select
                    value={newTaSemester}
                    onChange={(event) => setNewTaSemester(event.target.value)}
                    className={inputClass}
                  >
                    <option value="ganjil">Ganjil</option>
                    <option value="genap">Genap</option>
                  </select>
                </div>
                {taError ? (
                  <p className="mt-2 text-xs font-medium text-rose-500">{taError}</p>
                ) : null}
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTa(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={createTahunAjaran}
                    disabled={creatingTa}
                    className="rounded-lg bg-epaud-blue px-3 py-1.5 text-xs font-bold text-white transition hover:bg-epaud-blue-dark disabled:opacity-50"
                  >
                    {creatingTa ? "Menyimpan..." : "Tambah"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewTa(true)}
                className="text-xs font-semibold text-epaud-blue hover:underline"
              >
                + Tambah tahun ajaran baru
              </button>
            )}
          </div>
        </Field>
        <Field label="Nama Kelas *">
          <input
            name="nama"
            className={inputClass}
            placeholder="Kelas A"
            defaultValue={item?.nama ?? ""}
          />
        </Field>
        <OptionalFields>
          <Field label="Tingkat">
            <input
              name="tingkat"
              className={inputClass}
              placeholder="A / B / C"
              defaultValue={item?.tingkat ?? ""}
            />
          </Field>
        </OptionalFields>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonGhost}>
            Batal
          </button>
          <button type="submit" disabled={submitting} className={buttonPrimary}>
            {submitting ? "Menyimpan..." : editing ? "Perbarui" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type Peran = "" | "guru_kelas" | "guru_pendamping";

function KelasAnggotaModal({
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
  const [peran, setPeran] = useState<Record<string, Peran>>({});
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
        const map: Record<string, Peran> = {};
        assigned.data.forEach((a) => {
          map[a.guru_id] =
            a.peran === "guru_kelas" ? "guru_kelas" : "guru_pendamping";
        });
        setPeran(map);
      }
      if (ids.ok && Array.isArray(ids.data)) setMuridSet(new Set(ids.data));
      if (!g.ok && !assigned.ok) setError("Gagal memuat data anggota kelas.");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [kelas.id]);

  const guruKelasCount = useMemo(
    () => Object.values(peran).filter((p) => p === "guru_kelas").length,
    [peran],
  );

  function setGuruPeran(id: string, value: Peran) {
    setPeran((prev) => {
      const next = { ...prev };
      if (!value) delete next[id];
      else next[id] = value;
      return next;
    });
  }

  function toggleMurid(id: string) {
    setMuridSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (guruKelasCount > 1) {
      setError("Satu kelas hanya boleh punya satu Guru Kelas.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const guru = Object.entries(peran).map(([guru_id, value]) => ({
      guru_id,
      peran: value,
    }));
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
      subtitle="Atur penugasan guru dan anggota murid."
      onClose={onClose}
    >
      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Memuat data...</p>
      ) : (
        <div className="mt-5 space-y-6">
          {error ? <ErrorText>{error}</ErrorText> : null}

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Penugasan Guru
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Maksimal satu Guru Kelas; sisanya Guru Pendamping.
            </p>
            <div className="mt-3 space-y-2">
              {guruList.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data guru.</p>
              ) : (
                guruList.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-slate-700">
                      {g.nama}
                    </span>
                    <select
                      value={peran[g.id] ?? ""}
                      onChange={(event) =>
                        setGuruPeran(g.id, event.target.value as Peran)
                      }
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-epaud-blue"
                    >
                      <option value="">Tidak ditugaskan</option>
                      <option value="guru_kelas">Guru Kelas</option>
                      <option value="guru_pendamping">Guru Pendamping</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              Anggota Murid
            </h3>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {muridList.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data murid.</p>
              ) : (
                muridList.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={muridSet.has(m.id)}
                      onChange={() => toggleMurid(m.id)}
                      className="size-4 rounded border-slate-300 accent-epaud-blue"
                    />
                    <span className="font-medium text-slate-700">{m.nama}</span>
                  </label>
                ))
              )}
            </div>
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
