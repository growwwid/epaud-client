"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getEnvelope,
  getJson,
  patchJson,
  type MeResult,
  type Tiket,
  type TiketList,
} from "@/components/api";
import {
  EmptyRow,
  ErrorText,
  PageHeader,
  Panel,
  tableHeadClass,
  Modal,
} from "@/components/crud-ui";
import { FileIcon, XIcon } from "@/components/icons";

const STATUS = [
  { value: "baru", label: "Baru", className: "bg-amber-50 text-amber-600" },
  { value: "diproses", label: "Diproses", className: "bg-epaud-sky text-epaud-blue" },
  { value: "selesai", label: "Selesai", className: "bg-emerald-50 text-emerald-600" },
];

const KATEGORI: Record<string, string> = {
  verifikasi: "Verifikasi / OTP",
  login: "Login",
  data: "Data",
  teknis: "Teknis",
  lainnya: "Lainnya",
};

function statusMeta(status: string) {
  return STATUS.find((item) => item.value === status) ?? STATUS[0];
}

function formatWaktu(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function TiketPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Tiket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Tiket | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (!active) return;
      if (res.ok) setRole(res.data.role);
      else if (res.status === 401) router.replace("/login");
      else {
        setError(res.error.message);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (role !== "superadmin") return;
    let active = true;
    const query = status ? `?status=${status}` : "";
    getEnvelope<TiketList>(`/api/tiket-kendala${query}`).then((res) => {
      if (!active) return;
      if (res.ok) {
        setItems(res.data.data ?? []);
        setError(null);
      } else {
        setError(res.error.message);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [role, status, reloadKey]);

  async function ubahStatus(tiket: Tiket, next: string) {
    setBusyId(tiket.id);
    setError(null);
    const res = await patchJson(`/api/tiket-kendala/${tiket.id}/status`, {
      status: next,
    });
    setBusyId(null);
    if (res.ok) setReloadKey((key) => key + 1);
    else setError(res.error.message);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FileIcon className="size-6" />}
        title="Tiket Kendala"
        subtitle="Kelola laporan kendala dari pengguna ePAUD."
      />

      {role && role !== "superadmin" ? (
        <ErrorText>Halaman ini hanya untuk superadmin.</ErrorText>
      ) : null}

      {error ? <ErrorText>{error}</ErrorText> : null}

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={status}
            onChange={(event) => {
              setLoading(true);
              setStatus(event.target.value);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none focus:border-epaud-blue"
          >
            <option value="">Semua status</option>
            {STATUS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-2">Waktu</th>
                <th className="px-4 py-2">Pengirim</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Judul</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={6} label="Memuat data..." />
              ) : items.length === 0 ? (
                <EmptyRow colSpan={6} label="Tidak ada tiket." />
              ) : (
                items.map((tiket) => {
                  const badge = statusMeta(tiket.status);
                  return (
                    <tr
                      key={tiket.id}
                      className="rounded-xl bg-slate-50/60 text-sm text-slate-700"
                    >
                      <td className="rounded-l-xl px-4 py-3 text-slate-500">
                        {formatWaktu(tiket.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-slate-800">
                          {tiket.nama}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {tiket.email || tiket.phone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {KATEGORI[tiket.kategori] ?? tiket.kategori}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetail(tiket)}
                          className="text-left font-semibold text-slate-800 hover:text-epaud-blue hover:underline"
                        >
                          {tiket.judul}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="rounded-r-xl px-4 py-3">
                        <div className="flex justify-end">
                          <select
                            value={tiket.status}
                            disabled={busyId === tiket.id}
                            onChange={(event) =>
                              ubahStatus(tiket, event.target.value)
                            }
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-epaud-blue disabled:opacity-50"
                          >
                            {STATUS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {detail ? (
        <DetailModal tiket={detail} onClose={() => setDetail(null)} />
      ) : null}
    </div>
  );
}

function DetailModal({ tiket, onClose }: { tiket: Tiket; onClose: () => void }) {
  const badge = statusMeta(tiket.status);
  return (
    <Modal title={tiket.judul} subtitle={formatWaktu(tiket.created_at)} onClose={onClose} wide>
      <div className="mt-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {KATEGORI[tiket.kategori] ?? tiket.kategori}
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
            {tiket.sumber === "akun" ? "Akun" : "Publik"}
          </span>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-800">{tiket.nama}</p>
          <p className="mt-0.5 text-slate-500">
            {[tiket.email, tiket.phone].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {tiket.deskripsi}
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <XIcon className="size-4" />
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
