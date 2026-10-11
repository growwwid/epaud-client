"use client";

import { useState } from "react";
import { postJson, type SaldoMurid } from "@/components/api";
import { ErrorText, Field, Modal, inputClass } from "@/components/crud-ui";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/**
 * Modal catat transaksi tabungan (setor/tarik/koreksi). Dipakai di halaman
 * rekap maupun detail tabungan. Pemanggil bertanggung jawab atas reload data
 * setelah `onSaved`.
 */
export function CatatTransaksiModal({
  target,
  onClose,
  onSaved,
}: {
  target: SaldoMurid;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tipe, setTipe] = useState<"setor" | "tarik" | "koreksi">("setor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nominal = Number(String(data.get("nominal") ?? "").trim());
    const catatan = String(data.get("catatan") ?? "").trim();
    const tanggal = String(data.get("tanggal") ?? "").trim();

    if (!Number.isFinite(nominal) || nominal === 0) {
      setError("Nominal harus diisi dan tidak boleh nol.");
      return;
    }
    if (tipe !== "koreksi" && nominal < 0) {
      setError("Nominal setor/tarik harus bernilai positif.");
      return;
    }
    if (tipe === "koreksi" && !catatan) {
      setError("Alasan koreksi wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res =
      tipe === "koreksi"
        ? await postJson("/api/tabungan/koreksi", {
            murid_id: target.murid_id,
            nominal,
            catatan,
          })
        : await postJson("/api/tabungan", {
            murid_id: target.murid_id,
            tipe,
            nominal,
            ...(tanggal ? { tanggal } : {}),
            ...(catatan ? { catatan } : {}),
          });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title="Catat Transaksi"
      subtitle={`${target.nama}${target.kelas ? ` · ${target.kelas}` : ""} · saldo ${rupiah.format(target.saldo)}`}
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Jenis Transaksi">
          <select
            value={tipe}
            onChange={(event) =>
              setTipe(event.target.value as "setor" | "tarik" | "koreksi")
            }
            className={inputClass}
          >
            <option value="setor">Setor</option>
            <option value="tarik">Tarik</option>
            <option value="koreksi">Koreksi (penyesuaian saldo)</option>
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tipe === "koreksi" ? "Nominal (boleh minus) *" : "Nominal *"}>
            <input
              name="nominal"
              type="number"
              inputMode="numeric"
              className={inputClass}
              placeholder="50000"
            />
          </Field>
          <Field label="Tanggal">
            <input name="tanggal" type="date" className={inputClass} />
          </Field>
        </div>

        <Field label={tipe === "koreksi" ? "Alasan Koreksi *" : "Catatan"}>
          <input name="catatan" className={inputClass} placeholder="Opsional" />
        </Field>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
