"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getJson } from "@/components/api";
import { ErrorText, PageHeader, Panel } from "@/components/crud-ui";
import { ArrowRightIcon, UserIcon } from "@/components/icons";

const LABELS: Record<string, string> = {
  nama: "Nama Lengkap",
  nisn: "NISN",
  nik: "NIK",
  nip: "NIP",
  tanggal_lahir: "Tanggal Lahir",
  jenis_kelamin: "Jenis Kelamin",
  status: "Status",
  jenis: "Jenis",
  phone: "No. HP",
  email: "Email",
  role: "Peran",
  is_active: "Aktif",
  alamat: "Alamat",
};

const SKIP = new Set([
  "id",
  "akun_id",
  "orang_id",
  "foto",
  "must_change_password",
  "password_default",
  "sekolah_id",
]);

function format(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  const text = String(value);
  const maps: Record<string, Record<string, string>> = {
    jenis_kelamin: { laki_laki: "Laki-laki", perempuan: "Perempuan" },
    jenis: { guru_kelas: "Guru Kelas", guru_pendamping: "Guru Pendamping" },
    status: { aktif: "Aktif", alumni: "Alumni", keluar: "Keluar" },
  };
  if (maps[key]?.[text]) return maps[key][text];
  if (key === "tanggal_lahir") return text.slice(0, 10);
  return text;
}

export function PersonDetail({
  endpoint,
  title,
  backHref,
}: {
  endpoint: string;
  title: string;
  backHref: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<Record<string, unknown>>(endpoint).then((res) => {
      if (!active) return;
      if (res.ok) setData(res.data);
      else if (res.status === 401) router.replace("/login");
      else setError(res.error.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [endpoint, router]);

  const nama = typeof data?.nama === "string" ? data.nama : "Detail";
  const foto = typeof data?.foto === "string" ? data.foto : "";

  return (
    <div className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-epaud-blue"
      >
        <ArrowRightIcon className="size-4 rotate-180" />
        Kembali
      </Link>

      <PageHeader
        icon={<UserIcon className="size-6" />}
        title={title}
        subtitle="Informasi lengkap."
      />

      {error ? <ErrorText>{error}</ErrorText> : null}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat…</p>
      ) : data ? (
        <Panel>
          <div className="flex items-center gap-4">
            <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-epaud-sky text-xl font-bold text-epaud-blue">
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={foto} alt={nama} className="size-full object-cover" />
              ) : (
                nama.slice(0, 2).toUpperCase()
              )}
            </span>
            <p className="text-xl font-extrabold text-epaud-navy">{nama}</p>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {Object.entries(data)
              .filter(([key]) => !SKIP.has(key) && key !== "nama")
              .map(([key, value]) => (
                <div key={key} className="border-b border-slate-50 pb-2">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {LABELS[key] ?? key}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-700">
                    {format(key, value)}
                  </dd>
                </div>
              ))}
          </dl>
        </Panel>
      ) : null}
    </div>
  );
}