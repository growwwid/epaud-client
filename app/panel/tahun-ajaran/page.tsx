"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  type ApiResult,
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
  PageHeader,
  Panel,
  tableHeadClass,
} from "@/components/crud-ui";
import { HashIcon, PlusIcon } from "@/components/icons";

const SEMESTER_LABEL: Record<string, string> = {
  ganjil: "Ganjil",
  genap: "Genap",
};

function formatTanggal(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

export default function TahunAjaranPage() {
  const router = useRouter();
  const [items, setItems] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TahunAjaran | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = useCallback(
    (res: ApiResult<TahunAjaran[]>) => {
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

  useEffect(() => {
    getJson<TahunAjaran[]>("/api/tahun-ajaran").then(apply);
  }, [apply]);

  function reload() {
    setLoading(true);
    getJson<TahunAjaran[]>("/api/tahun-ajaran").then(apply);
  }

  async function activate(item: TahunAjaran) {
    setBusyId(item.id);
    setError(null);
    const res = await postJson(`/api/tahun-ajaran/${item.id}/activate`);
    setBusyId(null);
    if (res.ok) {
      setNotice(`Tahun ajaran "${item.nama}" diaktifkan.`);
      reload();
    } else {
      setError(res.error.message);
    }
  }

  async function remove(item: TahunAjaran) {
    if (!window.confirm(`Hapus tahun ajaran "${item.nama}"?`)) return;
    setBusyId(item.id);
    setError(null);
    const res = await deleteJson(`/api/tahun-ajaran/${item.id}`);
    setBusyId(null);
    if (res.ok) {
      setNotice("Tahun ajaran dihapus.");
      reload();
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HashIcon className="size-6" />}
        title="Tahun Ajaran"
        subtitle="Kelola periode tahun ajaran dan semester aktif."
      />

      <Panel>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            <PlusIcon className="size-5" />
            Tambah Tahun Ajaran
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
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Semester</th>
                <th className="px-4 py-2">Periode</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={6} label="Memuat data..." />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={6} label="Tidak ada data tahun ajaran." />
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
                      {SEMESTER_LABEL[item.semester] ?? item.semester}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatTanggal(item.tanggal_mulai)} —{" "}
                      {formatTanggal(item.tanggal_selesai)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.is_active ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="rounded-r-xl px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {item.is_active ? null : (
                          <button
                            type="button"
                            onClick={() => activate(item)}
                            disabled={busyId === item.id}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Aktifkan
                          </button>
                        )}
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
                          disabled={busyId === item.id || item.is_active}
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
        <TahunAjaranForm
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setNotice("Tahun ajaran ditambahkan.");
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <TahunAjaranForm
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setNotice("Tahun ajaran diperbarui.");
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function TahunAjaranForm({
  item,
  onClose,
  onSaved,
}: {
  item?: TahunAjaran;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(item);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      nama: String(data.get("nama") ?? "").trim(),
      semester: String(data.get("semester") ?? ""),
      tanggal_mulai: String(data.get("tanggal_mulai") ?? "").trim(),
      tanggal_selesai: String(data.get("tanggal_selesai") ?? "").trim(),
    };
    if (!payload.nama) {
      setError("Nama wajib diisi.");
      return;
    }
    if (!payload.semester) {
      setError("Semester wajib dipilih.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = item
      ? await patchJson<TahunAjaran>(`/api/tahun-ajaran/${item.id}`, payload)
      : await postJson<TahunAjaran>("/api/tahun-ajaran", {
          ...payload,
          is_active: false,
        });
    setSubmitting(false);
    if (res.ok) onSaved();
    else setError(res.error.message);
  }

  return (
    <Modal
      title={editing ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
      subtitle="Nama contoh: 2025/2026."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nama *">
          <input
            name="nama"
            className={inputClass}
            placeholder="2025/2026"
            defaultValue={item?.nama ?? ""}
          />
        </Field>
        <Field label="Semester *">
          <select
            name="semester"
            className={inputClass}
            defaultValue={item?.semester ?? "ganjil"}
          >
            <option value="ganjil">Ganjil</option>
            <option value="genap">Genap</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal Mulai">
            <input
              name="tanggal_mulai"
              type="date"
              className={inputClass}
              defaultValue={item?.tanggal_mulai?.slice(0, 10) ?? ""}
            />
          </Field>
          <Field label="Tanggal Selesai">
            <input
              name="tanggal_selesai"
              type="date"
              className={inputClass}
              defaultValue={item?.tanggal_selesai?.slice(0, 10) ?? ""}
            />
          </Field>
        </div>

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
