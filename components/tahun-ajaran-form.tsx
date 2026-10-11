"use client";

import { useState } from "react";
import { patchJson, postJson, type TahunAjaran } from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Modal,
} from "@/components/crud-ui";

export function TahunAjaranForm({
  item,
  onClose,
  onSaved,
}: {
  item?: TahunAjaran;
  onClose: () => void;
  onSaved: (item: TahunAjaran) => void;
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
    if (res.ok) onSaved(res.data);
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
