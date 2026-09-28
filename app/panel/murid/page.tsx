"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  type ApiResult,
  type Murid,
} from "@/components/api";
import {
  ChevronDownIcon,
  FilterIcon,
  MoreIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "@/components/icons";
import { Field, inputClass, Modal, OptionalFields } from "@/components/crud-ui";
import { PasswordInput } from "@/components/password-input";
import { PhotoInput } from "@/components/photo-input";

type AnakRow = {
  id: string;
  nama: string;
  nisn: string;
  tanggalLahir: string;
  tanggalLahirRaw: string;
  jenisKelamin: string;
  jenisKelaminRaw: string;
  kelas: string;
  ortuNama: string;
  ortuPhone: string;
  status: string;
  foto?: string;
};

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  alumni: "Alumni",
  keluar: "Keluar",
};

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-emerald-50 text-emerald-600",
  alumni: "bg-amber-50 text-amber-600",
  keluar: "bg-slate-100 text-slate-500",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatTanggal(value?: string | null) {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

function jenisKelaminLabel(value?: string) {
  if (value === "perempuan") return "Perempuan";
  if (value === "laki_laki") return "Laki-laki";
  return "—";
}

function toRow(murid: Murid): AnakRow {
  const jk = murid.jenis_kelamin;
  const validJk = jk === "perempuan" || jk === "laki_laki" ? jk : "";
  return {
    id: murid.id,
    nama: murid.nama,
    nisn: murid.nisn ?? "",
    tanggalLahir: formatTanggal(murid.tanggal_lahir),
    tanggalLahirRaw: murid.tanggal_lahir ? murid.tanggal_lahir.slice(0, 10) : "",
    jenisKelamin: jenisKelaminLabel(murid.jenis_kelamin),
    jenisKelaminRaw: validJk,
    kelas: "—",
    ortuNama: "—",
    ortuPhone: "—",
    status: murid.status,
    foto: murid.foto,
  };
}

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

export default function DataAnakPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AnakRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [muridOpen, setMuridOpen] = useState(false);
  const [editing, setEditing] = useState<AnakRow | null>(null);
  const [ortuOpen, setOrtuOpen] = useState(false);
  const [detail, setDetail] = useState<AnakRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const applyMurid = useCallback(
    (res: ApiResult<Murid[]>) => {
      if (res.ok) {
        setRows((Array.isArray(res.data) ? res.data : []).map(toRow));
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
    getJson<Murid[]>("/api/murid").then(applyMurid);
  }, [applyMurid]);

  function reload() {
    getJson<Murid[]>("/api/murid").then(applyMurid);
  }

  function applyStatus(id: string, status: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  }

  const kelasOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.kelas).filter((k) => k !== "—"))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchQuery =
        !q ||
        [row.nama, row.nisn, row.ortuNama].some((value) =>
          value.toLowerCase().includes(q),
        );
      const matchKelas = kelasFilter === "all" || row.kelas === kelasFilter;
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchQuery && matchKelas && matchStatus;
    });
  }, [rows, query, kelasFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const allChecked =
    pageItems.length > 0 && pageItems.every((row) => selected.has(row.id));

  function resetPage() {
    setPage(1);
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        pageItems.forEach((row) => next.delete(row.id));
      } else {
        pageItems.forEach((row) => next.add(row.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
          <UsersIcon className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
            Data Murid
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data murid di satu tempat dengan mudah dan cepat.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setBulkOpen((value) => !value)}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Bulk Actions ({selected.size})
              <ChevronDownIcon className="size-4 text-slate-400" />
            </button>
            {bulkOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Tutup"
                  onClick={() => setBulkOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute left-0 z-50 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-900/10">
                  {["Ubah Status", "Hapus"].map((label) => (
                    <span
                      key={label}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-400"
                    >
                      {label}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        segera
                      </span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="relative min-w-[14rem] flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Cari nama anak, NIS, atau wali..."
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
                  <Field label="Kelas">
                    <select
                      value={kelasFilter}
                      onChange={(event) => {
                        setKelasFilter(event.target.value);
                        resetPage();
                      }}
                      className={inputClass}
                    >
                      <option value="all">Semua kelas</option>
                      {kelasOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>
                          {kelas}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value);
                        resetPage();
                      }}
                      className={inputClass}
                    >
                      <option value="all">Semua status</option>
                      <option value="aktif">Aktif</option>
                      <option value="alumni">Alumni</option>
                      <option value="keluar">Keluar</option>
                    </select>
                  </Field>
                </div>
              </>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setOrtuOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <UserIcon className="size-5 text-slate-400" />
            Tambah Orang Tua
          </button>

          <button
            type="button"
            onClick={() => setMuridOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            <PlusIcon className="size-5" />
            Tambah Murid
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

        {notice ? (
          <p
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"
          >
            {notice}
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setNotice(null)}
              className="text-emerald-500 transition hover:text-emerald-700"
            >
              <XIcon className="size-4" />
            </button>
          </p>
        ) : null}

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[64rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Pilih semua"
                    className="size-4 cursor-pointer rounded border-slate-300 accent-epaud-blue"
                  />
                </th>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Nama Anak</th>
                <th className="px-4 py-2">NIS</th>
                <th className="px-4 py-2">Tanggal Lahir</th>
                <th className="px-4 py-2">Jenis Kelamin</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2">Orang Tua/Wali</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Memuat data murid...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
                  >
                    Tidak ada data murid.
                  </td>
                </tr>
              ) : (
                pageItems.map((row, index) => (
                  <tr key={row.id} className="rounded-xl bg-slate-50/60 text-sm text-slate-700">
                    <td className="rounded-l-xl px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Pilih ${row.nama}`}
                        className="size-4 cursor-pointer rounded border-slate-300 accent-epaud-blue"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{start + index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-epaud-blue ring-1 ring-slate-100">
                          {initials(row.nama)}
                        </span>
                        <span className="font-semibold text-slate-800">{row.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.nisn || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{row.tanggalLahir}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <UserIcon
                          className={`size-4 ${
                            row.jenisKelamin === "Perempuan"
                              ? "text-pink-500"
                              : "text-epaud-blue"
                          }`}
                        />
                        {row.jenisKelamin}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-epaud-sky px-3 py-1 text-xs font-semibold text-epaud-blue">
                        {row.kelas}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="block font-medium text-slate-600">{row.ortuNama}</span>
                      <span className="block text-xs text-slate-400">{row.ortuPhone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_BADGE[row.status] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="rounded-r-xl px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
                        aria-label={`Detail ${row.nama}`}
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
            {Math.min(start + perPage, filtered.length)} dari {filtered.length} data
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
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
                resetPage();
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

      {muridOpen ? (
        <MuridFormModal
          onClose={() => setMuridOpen(false)}
          onSaved={(murid, mode) => {
            setMuridOpen(false);
            reload();
            setNotice(
              mode === "create"
                ? `Anak "${murid.nama}" berhasil ditambahkan.`
                : `Data "${murid.nama}" berhasil diperbarui.`,
            );
          }}
        />
      ) : null}

      {editing ? (
        <MuridFormModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(murid, mode) => {
            setEditing(null);
            reload();
            setNotice(
              mode === "create"
                ? `Anak "${murid.nama}" berhasil ditambahkan.`
                : `Data "${murid.nama}" berhasil diperbarui.`,
            );
          }}
        />
      ) : null}

      {ortuOpen ? (
        <CreateOrtuModal
          onClose={() => setOrtuOpen(false)}
          onCreated={(nama) => {
            setOrtuOpen(false);
            setNotice(`Akun orang tua "${nama}" berhasil dibuat.`);
          }}
        />
      ) : null}

      {detail ? (
        <DetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
          onStatusChanged={(status) => applyStatus(detail.id, status)}
          onDeleted={() => {
            setDetail(null);
            reload();
            setNotice("Anak berhasil dikeluarkan.");
          }}
        />
      ) : null}
    </div>
  );
}

function MuridFormModal({
  item,
  onClose,
  onSaved,
}: {
  item?: AnakRow;
  onClose: () => void;
  onSaved: (murid: Murid, mode: "create" | "update") => void;
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
      nisn: String(data.get("nisn") ?? "").trim(),
      tanggal_lahir: String(data.get("tanggal_lahir") ?? "").trim(),
      jenis_kelamin: String(data.get("jenis_kelamin") ?? ""),
    };
    if (!payload.nama) {
      setError("Nama anak wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = item
      ? await patchJson<Murid>(`/api/murid/${item.id}`, payload)
      : await postJson<Murid>("/api/murid", payload);
    if (res.ok) {
      onSaved(res.data, editing ? "update" : "create");
      return;
    }
    setSubmitting(false);
    setError(res.error.message);
  }

  return (
    <Modal
      title={editing ? "Edit Murid" : "Tambah Murid"}
      subtitle="Identitas anak dicatat berdasarkan NIK."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nama Lengkap *">
          <input
            name="nama"
            className={inputClass}
            placeholder="Nama anak"
            defaultValue={item?.nama ?? ""}
          />
        </Field>
        <OptionalFields>
          <Field label="Foto">
            <PhotoInput name="foto" initial={item?.foto ?? ""} shape="circle" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {editing ? null : (
              <Field label="NIK">
                <input name="nik" className={inputClass} placeholder="NIK anak" />
              </Field>
            )}
            <Field label="NISN">
              <input
                name="nisn"
                className={inputClass}
                placeholder="NISN"
                defaultValue={item?.nisn ?? ""}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal Lahir">
              <input
                name="tanggal_lahir"
                type="date"
                className={inputClass}
                defaultValue={item?.tanggalLahirRaw ?? ""}
              />
            </Field>
            <Field label="Jenis Kelamin">
              <select
                name="jenis_kelamin"
                defaultValue={item?.jenisKelaminRaw ?? ""}
                className={inputClass}
              >
                <option value="">Belum dipilih</option>
                <option value="laki_laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </Field>
          </div>
        </OptionalFields>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
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

function CreateOrtuModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (nama: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultPassword, setDefaultPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const anakNik = String(data.get("anak_nik") ?? "")
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);
    const payload = {
      nama,
      nik: String(data.get("nik") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      anak_nik: anakNik,
    };
    if (!nama) {
      setError("Nama orang tua wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = await postJson<{ password_default?: boolean }>("/api/orang-tua", payload);
    if (res.ok) {
      if (res.data?.password_default) {
        setDefaultPassword(true);
        setSubmitting(false);
        return;
      }
      onCreated(nama);
      return;
    }
    setSubmitting(false);
    setError(res.error.message);
  }

  return (
    <Modal
      title="Tambah Orang Tua"
      subtitle="Akun login dibuat otomatis & ditautkan ke anak via NIK."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nama Lengkap *">
          <input name="nama" className={inputClass} placeholder="Nama orang tua/wali" />
        </Field>
        <OptionalFields>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NIK">
              <input name="nik" className={inputClass} placeholder="NIK orang tua" />
            </Field>
            <Field label="No. HP">
              <input name="phone" className={inputClass} placeholder="08xxxxxxxxxx" />
            </Field>
          </div>
          <Field label="Email">
            <input name="email" type="email" className={inputClass} placeholder="email@contoh.id" />
          </Field>
          <Field label="NIK Anak">
            <textarea
              name="anak_nik"
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
              placeholder="Satu NIK per baris (harus sudah terdaftar sebagai murid)"
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              name="password"
              className={inputClass}
              placeholder="Kosongkan untuk password default"
              hint="Kosongkan untuk memakai password default (default123)."
            />
          </Field>
        </OptionalFields>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
            {error}
          </p>
        ) : null}

        {defaultPassword ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            Akun dibuat dengan password default. Minta orang tua segera mengubahnya.
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {defaultPassword ? "Tutup" : "Batal"}
          </button>
          {defaultPassword ? null : (
            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function DetailModal({
  row,
  onClose,
  onEdit,
  onStatusChanged,
  onDeleted,
}: {
  row: AnakRow;
  onClose: () => void;
  onEdit: () => void;
  onStatusChanged: (status: string) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows: Array<[string, string]> = [
    ["Nama", row.nama],
    ["NIS", row.nisn || "—"],
    ["Tanggal Lahir", row.tanggalLahir],
    ["Jenis Kelamin", row.jenisKelamin],
    ["Kelas", row.kelas],
    ["Orang Tua/Wali", row.ortuNama],
    ["No. HP Wali", row.ortuPhone],
  ];

  async function changeStatus(status: string) {
    if (status === row.status) return;
    setBusy(true);
    setError(null);
    const res = await patchJson<Murid>(`/api/murid/${row.id}/status`, { status });
    setBusy(false);
    if (res.ok) onStatusChanged(res.data.status);
    else setError(res.error.message);
  }

  async function remove() {
    if (!window.confirm(`Keluarkan anak "${row.nama}"?`)) return;
    setBusy(true);
    setError(null);
    const res = await deleteJson(`/api/murid/${row.id}`);
    setBusy(false);
    if (res.ok) onDeleted();
    else setError(res.error.message);
  }

  return (
    <Modal title="Detail Murid" onClose={onClose}>
      <dl className="mt-5 divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-slate-800">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3 text-sm">
          <dt className="text-slate-500">Status</dt>
          <dd>
            <select
              value={row.status}
              onChange={(event) => changeStatus(event.target.value)}
              disabled={busy}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-epaud-blue disabled:opacity-50"
            >
              <option value="aktif">Aktif</option>
              <option value="alumni">Alumni</option>
              <option value="keluar">Keluar</option>
            </select>
          </dd>
        </div>
      </dl>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
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
          Keluarkan
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
