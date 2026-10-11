"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEnvelope,
  getJson,
  postJson,
  type ImportKalenderResult,
  type ListMeta,
  type MeResult,
  type SekolahAdmin,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  EmptyRow,
  ErrorText,
  Field,
  inputClass,
  Modal,
  PageHeader,
  Panel,
} from "@/components/crud-ui";
import { BuildingIcon, DownloadIcon, UploadIcon } from "@/components/icons";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  suspended: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  pending: "Menunggu",
  suspended: "Ditangguhkan",
};

export default function KelolaSekolahPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [items, setItems] = useState<SekolahAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [importTarget, setImportTarget] = useState<SekolahAdmin | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getEnvelope<{ data: SekolahAdmin[]; meta: ListMeta }>(
      "/api/sekolah?page=1&size=100",
    ).then((res) => {
      if (res.ok) {
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
        setError(null);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (!res.ok) {
        if (res.status === 401) router.replace("/login");
        else setError(res.error.message);
        return;
      }
      if (res.data.role !== "superadmin") {
        router.replace("/panel");
        return;
      }
      setAllowed(true);
      load();
    });
  }, [router, load]);

  async function changeStatus(school: SekolahAdmin, action: "activate" | "suspend") {
    setBusyId(school.id);
    const res = await postJson(`/api/sekolah/${school.id}/${action}`);
    setBusyId(null);
    if (res.ok) load();
    else setError(res.error.message);
  }

  if (!allowed) {
    return (
      <p className="text-sm text-slate-400">
        {error ?? "Memeriksa hak akses…"}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<BuildingIcon className="size-6" />}
        title="Kelola Sekolah"
        subtitle="Aktivasi sekolah dan impor kalender akademik (superadmin)."
      />

      <Panel>
        {error ? (
          <div className="mb-4">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2">Sekolah</th>
                <th className="px-4 py-2">NPSN</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={5} label="Memuat data..." />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={5} label="Tidak ada sekolah." />
              ) : (
                items.map((school) => (
                  <tr
                    key={school.id}
                    className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                  >
                    <td className="rounded-l-xl px-4 py-3 font-semibold text-slate-800">
                      {school.nama}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{school.npsn || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{school.tipe || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_BADGE[school.status ?? ""] ?? "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {STATUS_LABEL[school.status ?? ""] ?? school.status ?? "—"}
                      </span>
                    </td>
                    <td className="rounded-r-xl px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setImportTarget(school)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <UploadIcon className="size-3.5" />
                          Import Kalender
                        </button>
                        {school.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => changeStatus(school, "suspend")}
                            disabled={busyId === school.id}
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => changeStatus(school, "activate")}
                            disabled={busyId === school.id}
                            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Aktifkan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {importTarget ? (
        <ImportKalenderModal
          school={importTarget}
          onClose={() => setImportTarget(null)}
        />
      ) : null}
    </div>
  );
}

function ImportKalenderModal({
  school,
  onClose,
}: {
  school: SekolahAdmin;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("merge");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportKalenderResult | null>(null);

  function downloadExample() {
    const example = {
      metadata: {
        tahun_pelajaran: "2026/2027",
        jenjang: "TK",
        timezone: "Asia/Jakarta",
        source: { name: "Dinas Pendidikan", nomor_surat: "421/001/2026" },
      },
      data: [
        { date: "2026-07-15", name: "Awal Tahun Ajaran", category: "kegiatan" },
        { date: "2026-08-17", name: "HUT Kemerdekaan RI", category: "libur" },
      ],
      kegiatan_tanpa_tanggal_spesifik: [],
    };
    const blob = new Blob([JSON.stringify(example, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contoh-kalender.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Pilih berkas kalender (JSON) terlebih dahulu.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(
        `/api/kelola/kalender/${school.id}/import?mode=${mode}`,
        { method: "POST", body: form },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setError(payload?.error?.message ?? "Gagal mengimpor kalender.");
        return;
      }
      setResult((payload?.data ?? payload) as ImportKalenderResult);
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Import Kalender Akademik"
      subtitle={`Untuk ${school.nama}. Format JSON.`}
      onClose={onClose}
    >
      {result ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold">Impor selesai.</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Dibuat: {result.dibuat}</li>
              <li>Dilewati: {result.dilewati}</li>
              <li>Ditolak: {result.ditolak}</li>
              <li>Diabaikan: {result.diabaikan}</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={buttonPrimary}>
              Selesai
            </button>
          </div>
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
          <button
            type="button"
            onClick={downloadExample}
            className="flex items-center gap-2 text-sm font-semibold text-epaud-blue hover:underline"
          >
            <DownloadIcon className="size-4" />
            Unduh contoh JSON
          </button>
          <Field label="Berkas kalender (JSON) *">
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-epaud-sky file:px-4 file:py-2 file:text-sm file:font-semibold file:text-epaud-blue"
            />
          </Field>
          <Field label="Mode">
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              className={inputClass}
            >
              <option value="merge">Gabung (merge)</option>
              <option value="replace">Ganti dari sumber sama (replace)</option>
            </select>
          </Field>

          {error ? <ErrorText>{error}</ErrorText> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={buttonGhost}>
              Batal
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Mengimpor..." : "Impor"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
