"use client";

import { useState } from "react";
import { toast } from "sonner";
import { buttonGhost, buttonPrimary, Modal } from "@/components/crud-ui";
import { downloadCsv, parseCsv, csvRowsToObjects } from "@/components/csv";
import { DownloadIcon, UploadIcon } from "@/components/icons";

export type ImportSummary = { ok: number; errors: string[] };

/**
 * Impor data dari file CSV: unduh contoh, pilih berkas, lalu kirim tiap baris
 * lewat `onImport` (biasanya memanggil API create yang sudah ada per baris).
 */
export function CsvImport({
  templateName,
  headers,
  example,
  onImport,
}: {
  templateName: string;
  headers: string[];
  example: string[][];
  onImport: (rows: Record<string, string>[]) => Promise<ImportSummary>;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function reset() {
    setRows([]);
    setFileName("");
    setSubmitting(false);
    setSummary(null);
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = csvRowsToObjects(parseCsv(await file.text()));
      setRows(parsed);
      setFileName(file.name);
      setSummary(null);
      if (parsed.length === 0) toast.error("CSV tidak berisi data.");
    } catch {
      toast.error("Gagal membaca file CSV.");
    } finally {
      event.target.value = "";
    }
  }

  async function submit() {
    setSubmitting(true);
    setSummary(null);
    try {
      const result = await onImport(rows);
      setSummary(result);
      if (result.ok > 0) toast.success(`${result.ok} data berhasil diimpor.`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} baris gagal diimpor.`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <UploadIcon className="size-5 text-slate-400" />
        Import CSV
      </button>

      {open ? (
        <Modal
          title="Import CSV"
          subtitle={`Kolom: ${headers.join(", ")}.`}
          onClose={() => {
            setOpen(false);
            reset();
          }}
        >
          <div className="mt-5 space-y-4">
            <button
              type="button"
              onClick={() => downloadCsv(templateName, headers, example)}
              className="flex items-center gap-2 text-sm font-semibold text-epaud-blue hover:underline"
            >
              <DownloadIcon className="size-4" />
              Unduh contoh CSV
            </button>

            <div className="space-y-1.5">
              <span className="pl-1 text-[13px] font-semibold text-slate-600">
                File CSV
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-epaud-sky file:px-4 file:py-2 file:text-sm file:font-semibold file:text-epaud-blue"
              />
              {fileName ? (
                <p className="pl-1 text-xs text-slate-400">
                  {fileName} · {rows.length} baris terdeteksi
                </p>
              ) : null}
            </div>

            {summary ? (
              <div className="space-y-2">
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
                  {summary.ok} data berhasil diimpor.
                </p>
                {summary.errors.length > 0 ? (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                    <p>{summary.errors.length} baris gagal:</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {summary.errors.slice(0, 10).map((message, index) => (
                        <li key={index}>{message}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className={buttonGhost}
              >
                {summary ? "Tutup" : "Batal"}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || rows.length === 0}
                className={buttonPrimary}
              >
                {submitting ? "Mengimpor..." : `Impor ${rows.length} baris`}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
