"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  type ApiResult,
  type Guru,
} from "@/components/api";
import {
  ChevronDownIcon,
  FilterIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { Field, inputClass, Modal, OptionalFields } from "@/components/crud-ui";
import { PasswordInput } from "@/components/password-input";
import { PhotoInput } from "@/components/photo-input";
import { CsvImport } from "@/components/csv-import";
import { useTahunAjaran } from "../tahun-ajaran-context";

const JENIS_LABEL: Record<string, string> = {
  guru_kelas: "Guru Kelas",
  guru_pendamping: "Guru Pendamping",
};

const JENIS_BADGE: Record<string, string> = {
  guru_kelas: "bg-epaud-sky text-epaud-blue",
  guru_pendamping: "bg-violet-50 text-violet-600",
};

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

export default function DataGuruPage() {
  const router = useRouter();
  const { withTahunAjaran } = useTahunAjaran();
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Guru | null>(null);
  const [detail, setDetail] = useState<Guru | null>(null);

  const applyGuru = useCallback(
    (res: ApiResult<Guru[]>) => {
      if (res.ok) {
        setGuru(Array.isArray(res.data) ? res.data : []);
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
    getJson<Guru[]>(withTahunAjaran("/api/guru")).then(applyGuru);
  }, [applyGuru, withTahunAjaran]);

  function reload() {
    getJson<Guru[]>(withTahunAjaran("/api/guru")).then(applyGuru);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guru.filter((item) => {
      const matchQuery =
        !q ||
        [item.nama, item.nip, item.email, item.phone].some((value) =>
          value?.toLowerCase().includes(q),
        );
      const matchJenis = jenisFilter === "all" || item.jenis === jenisFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "aktif" ? item.is_active : !item.is_active);
      return matchQuery && matchJenis && matchStatus;
    });
  }, [guru, query, jenisFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
          <UserIcon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
            Data Guru
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data guru di satu tempat dengan mudah dan cepat.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari nama guru, NIP, atau email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((value) => !value)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <FilterIcon className="size-5 text-slate-400" />
              Filter
            </button>

            {filterOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Tutup filter"
                  onClick={() => setFilterOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 z-50 mt-2 w-64 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-900/10">
                  <Field label="Jenis Guru">
                    <select
                      value={jenisFilter}
                      onChange={(event) => {
                        setJenisFilter(event.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option value="all">Semua jenis</option>
                      <option value="guru_kelas">Guru Kelas</option>
                      <option value="guru_pendamping">Guru Pendamping</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value);
                        setPage(1);
                      }}
                      className={inputClass}
                    >
                      <option value="all">Semua status</option>
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Tidak Aktif</option>
                    </select>
                  </Field>
                </div>
              </>
            ) : null}
          </div>

          <CsvImport
            templateName="contoh-guru.csv"
            headers={["nama", "jenis", "nik", "nip", "email", "phone", "password"]}
            example={[
              ["Budi Santoso", "guru_kelas", "3201234567890001", "1987654321", "budi@sekolah.id", "081234567890", "rahasia123"],
              ["Siti Aminah", "guru_pendamping", "", "", "siti@sekolah.id", "081298765432", ""],
            ]}
            onImport={async (rows) => {
              let ok = 0;
              const errors: string[] = [];
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const res = await postJson<{ guru: Guru }>("/api/guru", {
                  nama: row.nama,
                  jenis: row.jenis,
                  nik: row.nik,
                  nip: row.nip,
                  email: row.email,
                  phone: row.phone,
                  password: row.password,
                });
                if (res.ok) ok++;
                else errors.push(`Baris ${i + 2}: ${res.error.message}`);
              }
              if (ok > 0) reload();
              return { ok, errors };
            }}
          />

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            <PlusIcon className="size-5" />
            Tambah Guru
          </button>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Guru</th>
                <th className="px-4 py-2">NIP</th>
                <th className="px-4 py-2">Jenis</th>
                <th className="px-4 py-2">Kontak</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Memuat data guru...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Tidak ada data guru.
                  </td>
                </tr>
              ) : (
                pageItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                  >
                    <td className="rounded-l-xl px-4 py-3 text-slate-500">
                      {start + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-epaud-blue ring-1 ring-slate-100">
                          {initials(item.nama)}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.nama}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.nip || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          JENIS_BADGE[item.jenis] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {JENIS_LABEL[item.jenis] ?? item.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="block">{item.email || "—"}</span>
                      <span className="block text-xs text-slate-400">
                        {item.phone || "—"}
                      </span>
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
                    <td className="rounded-r-xl px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(item)}
                        aria-label={`Detail ${item.nama}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-slate-600"
                      >
                        <MoreIcon className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Menampilkan {filtered.length === 0 ? 0 : start + 1} -{" "}
            {Math.min(start + perPage, filtered.length)} dari {filtered.length}{" "}
            data
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronDownIcon className="size-4 rotate-90" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && arr[idx - 1] !== p - 1 ? (
                      <span className="px-1 text-slate-400">…</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      className={`flex size-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
                        p === currentPage
                          ? "bg-epaud-blue text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronDownIcon className="size-4 -rotate-90" />
              </button>
            </div>
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-epaud-blue"
            >
              <option value={10}>10 / halaman</option>
              <option value={25}>25 / halaman</option>
              <option value={50}>50 / halaman</option>
            </select>
          </div>
        </div>
      </div>

      {createOpen ? (
        <GuruFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <GuruFormModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}

      {detail ? (
        <GuruDetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
          onUpdated={(updated) => {
            setDetail(updated);
            reload();
          }}
          onDeleted={() => {
            setDetail(null);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

function GuruFormModal({
  item,
  onClose,
  onSaved,
}: {
  item?: Guru;
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
      nik: String(data.get("nik") ?? "").trim(),
      nip: String(data.get("nip") ?? "").trim(),
      jenis: String(data.get("jenis") ?? ""),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      foto: String(data.get("foto") ?? ""),
    };

    if (!payload.nama) {
      setError("Nama guru wajib diisi.");
      return;
    }
    if (!payload.jenis) {
      setError("Jenis guru wajib dipilih.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = item
      ? await patchJson<Guru>(`/api/guru/${item.id}`, payload)
      : await postJson<{ guru: Guru }>("/api/guru", payload);
    if (res.ok) {
      onSaved();
      return;
    }
    setSubmitting(false);
    setError(res.error.message);
  }

  return (
    <Modal
      title={editing ? "Edit Guru" : "Tambah Guru"}
      subtitle={
        editing
          ? "Perbarui data guru beserta akunnya."
          : "Akun login guru dibuat otomatis."
      }
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nama Lengkap *">
          <input
            name="nama"
            className={inputClass}
            placeholder="Nama guru"
            defaultValue={item?.nama ?? ""}
          />
        </Field>
        <Field label="Jenis Guru *">
          <select
            name="jenis"
            defaultValue={item?.jenis ?? "guru_kelas"}
            className={inputClass}
          >
            <option value="guru_kelas">Guru Kelas</option>
            <option value="guru_pendamping">Guru Pendamping</option>
          </select>
        </Field>

        <OptionalFields>
          <Field label="Foto">
            <PhotoInput name="foto" initial={item?.foto ?? ""} shape="circle" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {editing ? null : (
              <Field label="NIK">
                <input name="nik" className={inputClass} placeholder="NIK" />
              </Field>
            )}
            <Field label="NIP">
              <input
                name="nip"
                className={inputClass}
                placeholder="NIP"
                defaultValue={item?.nip ?? ""}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input
                name="email"
                type="email"
                className={inputClass}
                placeholder="email@sekolah.id"
                defaultValue={item?.email ?? ""}
              />
            </Field>
            <Field label="No. HP">
              <input
                name="phone"
                className={inputClass}
                placeholder="08xxxxxxxxxx"
                defaultValue={item?.phone ?? ""}
              />
            </Field>
          </div>
          <Field label="Password">
            <PasswordInput
              name="password"
              className={inputClass}
              placeholder={
                editing
                  ? "Kosongkan bila tidak diubah"
                  : "Kosongkan untuk password default"
              }
              hint={
                editing
                  ? undefined
                  : "Kosongkan untuk memakai password default (default123)."
              }
            />
          </Field>
        </OptionalFields>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? "Menyimpan..." : editing ? "Perbarui" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function GuruDetailModal({
  item,
  onClose,
  onEdit,
  onUpdated,
  onDeleted,
}: {
  item: Guru;
  onClose: () => void;
  onEdit: () => void;
  onUpdated: (item: Guru) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows: Array<[string, string]> = [
    ["Nama", item.nama],
    ["NIP", item.nip || "—"],
    ["Jenis", JENIS_LABEL[item.jenis] ?? item.jenis],
    ["Email", item.email || "—"],
    ["No. HP", item.phone || "—"],
    ["Status", item.is_active ? "Aktif" : "Tidak Aktif"],
  ];

  async function toggleActive() {
    setBusy(true);
    setError(null);
    const res = await patchJson<Guru>(`/api/guru/${item.id}`, {
      nama: item.nama,
      nip: item.nip ?? "",
      jenis: item.jenis,
      email: item.email ?? "",
      phone: item.phone ?? "",
      is_active: !item.is_active,
    });
    setBusy(false);
    if (res.ok) onUpdated(res.data);
    else setError(res.error.message);
  }

  async function remove() {
    if (!window.confirm(`Hapus guru "${item.nama}"?`)) return;
    setBusy(true);
    setError(null);
    const res = await deleteJson(`/api/guru/${item.id}`);
    setBusy(false);
    if (res.ok) onDeleted();
    else setError(res.error.message);
  }

  return (
    <Modal title="Detail Guru" onClose={onClose}>
      <dl className="mt-5 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={busy}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {item.is_active ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          className="h-11 rounded-xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark disabled:opacity-50"
        >
          Edit
        </button>
      </div>
    </Modal>
  );
}
