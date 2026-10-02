"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  putJson,
  type AkunResult,
  type AkunSekolah,
  type ApiResult,
  type OrangRef,
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
import { PasswordInput } from "@/components/password-input";
import { PhotoInput } from "@/components/photo-input";
import { CsvImport } from "@/components/csv-import";
import { splitList } from "@/components/csv";
import { PlusIcon } from "@/components/icons";

export function AkunSekolahCrud({
  variant,
  title,
  subtitle,
  icon,
  allowCreate = true,
}: {
  variant: "admin" | "orangtua";
  title: string;
  subtitle: string;
  icon: ReactNode;
  allowCreate?: boolean;
}) {
  const router = useRouter();
  const isOrtu = variant === "orangtua";
  const endpoint = isOrtu ? "/api/orang-tua" : "/api/admin";

  const [items, setItems] = useState<AkunSekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AkunSekolah | null>(null);
  const [anakTarget, setAnakTarget] = useState<AkunSekolah | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = useCallback(
    (res: ApiResult<AkunSekolah[]>) => {
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
    getJson<AkunSekolah[]>(endpoint).then(apply);
  }, [endpoint, apply]);

  function reload() {
    setLoading(true);
    getJson<AkunSekolah[]>(endpoint).then(apply);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.nama, item.email, item.phone].some((value) =>
        value?.toLowerCase().includes(q),
      ),
    );
  }, [items, query]);

  async function remove(item: AkunSekolah) {
    if (!window.confirm(`Nonaktifkan akun "${item.nama}"?`)) return;
    setBusyId(item.akun_id);
    setError(null);
    const res = await deleteJson(`${endpoint}/${item.akun_id}`);
    setBusyId(null);
    if (res.ok) {
      setNotice(`Akun "${item.nama}" dinonaktifkan.`);
      reload();
    } else {
      setError(res.error.message);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={icon} title={title} subtitle={subtitle} />

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, atau no. HP..."
            className="h-11 min-w-[14rem] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:bg-white focus:ring-4 focus:ring-epaud-blue/10"
          />
          {isOrtu ? (
            <CsvImport
              templateName="contoh-orang-tua.csv"
              headers={["nama", "nik", "email", "phone", "password", "anak_nik"]}
              example={[
                ["Siti Rahayu", "3201234567890004", "siti@email.id", "081234567891", "rahasia123", "3201234567890002;3201234567890003"],
                ["Andi Wijaya", "", "andi@email.id", "081234567892", "", ""],
              ]}
              onImport={async (rows) => {
                let ok = 0;
                const errors: string[] = [];
                for (let i = 0; i < rows.length; i++) {
                  const row = rows[i];
                  const res = await postJson<AkunResult>("/api/orang-tua", {
                    nama: row.nama,
                    nik: row.nik,
                    email: row.email,
                    phone: row.phone,
                    password: row.password,
                    anak_nik: splitList(row.anak_nik ?? ""),
                  });
                  if (res.ok) ok++;
                  else errors.push(`Baris ${i + 2}: ${res.error.message}`);
                }
                if (ok > 0) reload();
                return { ok, errors };
              }}
            />
          ) : null}

          {allowCreate ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex h-11 items-center gap-2 rounded-xl bg-epaud-blue px-5 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
            >
              <PlusIcon className="size-5" />
              Tambah {isOrtu ? "Orang Tua" : "Admin"}
            </button>
          ) : null}
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
                <th className="px-4 py-2">Kontak</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={5} label="Memuat data..." />
              ) : filtered.length === 0 ? (
                <EmptyRow colSpan={5} label="Tidak ada data." />
              ) : (
                filtered.map((item, index) => (
                  <tr
                    key={item.akun_id}
                    className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                  >
                    <td className="rounded-l-xl px-4 py-3 text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        {item.nama}
                      </span>
                      {item.must_change_password ? (
                        <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                          password default
                        </span>
                      ) : null}
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
                    <td className="rounded-r-xl px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isOrtu ? (
                          <button
                            type="button"
                            onClick={() => setAnakTarget(item)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Kelola Anak
                          </button>
                        ) : null}
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
                          disabled={busyId === item.akun_id || !item.is_active}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          Nonaktifkan
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
        <AkunForm
          variant={variant}
          onClose={() => setFormOpen(false)}
          onSaved={(nama, passwordDefault) => {
            setFormOpen(false);
            setNotice(
              passwordDefault
                ? `Akun "${nama}" dibuat dengan password default.`
                : `Akun "${nama}" berhasil dibuat.`,
            );
            reload();
          }}
        />
      ) : null}

      {editing ? (
        <AkunForm
          variant={variant}
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(nama) => {
            setEditing(null);
            setNotice(`Akun "${nama}" berhasil diperbarui.`);
            reload();
          }}
        />
      ) : null}

      {anakTarget ? (
        <AnakModal
          akun={anakTarget}
          onClose={() => setAnakTarget(null)}
          onSaved={(nama) => {
            setAnakTarget(null);
            setNotice(`Tautan anak "${nama}" berhasil diperbarui.`);
          }}
        />
      ) : null}
    </div>
  );
}

function anakNama(anak: OrangRef) {
  return anak.nama ?? anak.Nama ?? "Tanpa nama";
}

function anakNik(anak: OrangRef) {
  return anak.nik ?? anak.NIK ?? "";
}

function AnakModal({
  akun,
  onClose,
  onSaved,
}: {
  akun: AkunSekolah;
  onClose: () => void;
  onSaved: (nama: string) => void;
}) {
  const [items, setItems] = useState<OrangRef[]>([]);
  const [nikText, setNikText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<OrangRef[]>(`/api/orang-tua/${akun.akun_id}/anak`).then((res) => {
      if (!active) return;
      if (res.ok) {
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(list);
        setNikText(list.map(anakNik).filter(Boolean).join("\n"));
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [akun.akun_id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const anak_nik = nikText
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean);

    setError(null);
    setSubmitting(true);
    const res = await putJson<OrangRef[]>(`/api/orang-tua/${akun.akun_id}/anak`, {
      anak_nik,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error.message);
      return;
    }

    onSaved(akun.nama);
  }

  return (
    <Modal
      title="Kelola Anak"
      subtitle={`Tautan anak untuk akun ${akun.nama} (berdasarkan NIK murid).`}
      onClose={onClose}
    >
      <div className="mt-5 space-y-4">
        <div>
          <span className="pl-1 text-[13px] font-semibold text-slate-600">
            Anak tertaut saat ini
          </span>
          {loading ? (
            <p className="mt-2 text-sm text-slate-400">Memuat data...</p>
          ) : items.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Belum ada anak tertaut.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {items.map((anak, index) => (
                <li
                  key={`${anakNik(anak)}-${index}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {anakNama(anak)}
                  </span>
                  <span className="text-slate-400">{anakNik(anak) || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="NIK Anak (ganti seluruh tautan)">
            <textarea
              name="anak_nik"
              rows={4}
              value={nikText}
              onChange={(event) => setNikText(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
              placeholder="Satu NIK per baris (harus sudah terdaftar sebagai murid)"
            />
          </Field>

          {error ? <ErrorText>{error}</ErrorText> : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={buttonGhost}>
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className={buttonPrimary}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function AkunForm({
  variant,
  item,
  onClose,
  onSaved,
}: {
  variant: "admin" | "orangtua";
  item?: AkunSekolah;
  onClose: () => void;
  onSaved: (nama: string, passwordDefault?: boolean) => void;
}) {
  const isOrtu = variant === "orangtua";
  const endpoint = isOrtu ? "/api/orang-tua" : "/api/admin";
  const editing = Boolean(item);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!nama) {
      setError("Nama wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);

    if (item) {
      const res = await patchJson<AkunSekolah>(`${endpoint}/${item.akun_id}`, {
        nama,
        email,
        phone,
        password,
        foto: String(data.get("foto") ?? ""),
      });
      setSubmitting(false);
      if (res.ok) onSaved(nama);
      else setError(res.error.message);
      return;
    }

    const body: Record<string, unknown> = {
      nama,
      email,
      phone,
      password,
      foto: String(data.get("foto") ?? ""),
    };
    if (isOrtu) {
      body.nik = String(data.get("nik") ?? "").trim();
      body.anak_nik = String(data.get("anak_nik") ?? "")
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean);
    }
    const res = await postJson<AkunResult>(endpoint, body);
    setSubmitting(false);
    if (res.ok) onSaved(nama, res.data?.password_default);
    else setError(res.error.message);
  }

  return (
    <Modal
      title={editing ? "Edit" : "Tambah"}
      subtitle={
        editing
          ? "Perbarui data akun. Kosongkan password bila tidak diubah."
          : "Akun login dibuat otomatis saat data disimpan."
      }
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Nama Lengkap *">
          <input
            name="nama"
            className={inputClass}
            placeholder="Nama lengkap"
            defaultValue={item?.nama ?? ""}
          />
        </Field>
        <OptionalFields>
          <Field label="Foto">
            <PhotoInput name="foto" initial={item?.foto ?? ""} shape="circle" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input
                name="email"
                type="email"
                className={inputClass}
                placeholder="email@contoh.id"
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

          {isOrtu && !editing ? (
            <>
              <Field label="NIK">
                <input name="nik" className={inputClass} placeholder="NIK orang tua" />
              </Field>
              <Field label="NIK Anak">
                <textarea
                  name="anak_nik"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
                  placeholder="Satu NIK per baris (harus sudah terdaftar sebagai murid)"
                />
              </Field>
            </>
          ) : null}

          <Field label="Password">
            <PasswordInput
              name="password"
              className={inputClass}
              placeholder={editing ? "Kosongkan bila tidak diubah" : "Kosongkan untuk password default"}
              hint={
                editing
                  ? undefined
                  : "Kosongkan untuk memakai password default (default123)."
              }
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
