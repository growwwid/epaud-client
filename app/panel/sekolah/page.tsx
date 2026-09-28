"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getJson,
  patchJson,
  type MeResult,
  type SekolahProfil,
} from "@/components/api";
import {
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Notice,
  PageHeader,
  Panel,
} from "@/components/crud-ui";
import { BuildingIcon } from "@/components/icons";

const TIPE_OPTIONS = ["TK", "RA", "SPS", "KB", "TPA"];

const MAX_LOGO_BYTES = 1_200_000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SekolahPage() {
  const router = useRouter();
  const [profil, setProfil] = useState<SekolahProfil | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [logo, setLogo] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      const [meRes, profilRes] = await Promise.all([
        getJson<MeResult>("/api/auth/me"),
        getJson<SekolahProfil>("/api/profil-sekolah"),
      ]);
      if (!active) return;
      if (meRes.ok) {
        setCanManage(
          meRes.data.role === "kepala_sekolah" || meRes.data.role === "admin_sekolah",
        );
      }
      if (profilRes.ok) {
        setProfil(profilRes.data);
        setLogo(profilRes.data.logo ?? "");
      } else if (profilRes.status === 401) {
        router.replace("/login");
      } else {
        setError(profilRes.error.message);
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError("Ukuran logo terlalu besar (maks ~1 MB).");
      return;
    }
    setError(null);
    setLogo(await readFileAsDataUrl(file));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const res = await patchJson<SekolahProfil>("/api/profil-sekolah", {
      nama: String(data.get("nama") ?? "").trim(),
      npsn: String(data.get("npsn") ?? "").trim(),
      tipe: String(data.get("tipe") ?? "").trim(),
      alamat: String(data.get("alamat") ?? "").trim(),
      logo,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setProfil(res.data);
    setNotice("Profil sekolah disimpan. Memuat ulang tampilan…");
    setTimeout(() => window.location.reload(), 800);
  }

  if (loading || !profil) {
    return <p className="text-sm text-slate-400">Memuat profil sekolah…</p>;
  }

  if (!canManage) {
    return (
      <div className="space-y-5">
        <PageHeader
          icon={<BuildingIcon className="size-6" />}
          title="Profil Sekolah"
          subtitle="Informasi sekolah."
        />
        <ErrorText>Hanya kepala sekolah/admin yang dapat mengubah profil sekolah.</ErrorText>
        <Panel>
          <dl className="space-y-2 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">Nama</dt>
              <dd>{profil.nama}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">NPSN</dt>
              <dd>{profil.npsn || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Alamat</dt>
              <dd>{profil.alamat || "—"}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<BuildingIcon className="size-6" />}
        title="Profil Sekolah"
        subtitle="Logo, nama, NPSN, dan alamat sekolah. Logo dipakai di panel & favicon."
      />

      {error ? <ErrorText>{error}</ErrorText> : null}
      {notice ? <Notice onClose={() => setNotice(null)}>{notice}</Notice> : null}

      <Panel>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo || "/epaud-logo.png"}
                alt="Logo sekolah"
                className="h-16 w-auto object-contain"
              />
            </span>
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-slate-600">
                Logo sekolah
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
                className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-epaud-sky file:px-4 file:py-2 file:text-sm file:font-semibold file:text-epaud-blue"
              />
              {logo ? (
                <button
                  type="button"
                  onClick={() => setLogo("")}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Hapus logo
                </button>
              ) : (
                <p className="text-xs text-slate-400">Kosong = pakai logo ePAUD default.</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama sekolah *">
              <input name="nama" defaultValue={profil.nama} required className={inputClass} />
            </Field>
            <Field label="NPSN">
              <input name="npsn" defaultValue={profil.npsn} inputMode="numeric" className={inputClass} />
            </Field>
          </div>

          <Field label="Tipe">
            <select name="tipe" defaultValue={profil.tipe} className={inputClass}>
              {TIPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Alamat">
            <textarea name="alamat" defaultValue={profil.alamat} rows={3} className={inputClass} />
          </Field>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={buttonPrimary}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}