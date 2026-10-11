"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getJson,
  patchJson,
  type MeResult,
  type SekolahProfil,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Modal,
} from "@/components/crud-ui";
import {
  AtSignIcon,
  BadgeCheckIcon,
  BuildingIcon,
  GlobeIcon,
  ImageIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/icons";
import { uploadImage } from "@/lib/upload";

const MAX_LOGO_BYTES = 1_200_000;

const BENTUK_OPTIONS = [
  { value: "TK", label: "Taman Kanak-kanak (TK)" },
  { value: "RA", label: "Raudhatul Athfal (RA)" },
  { value: "SPS", label: "Satuan PAUD Sejenis (SPS)" },
  { value: "KB", label: "Kelompok Bermain (KB)" },
  { value: "TPA", label: "Taman Penitipan Anak (TPA)" },
];

const AKREDITASI_OPTIONS = ["", "A", "B", "C", "Belum Terakreditasi"];
const STATUS_SATUAN_OPTIONS = ["", "Negeri", "Swasta"];

const TABS = [
  { id: "profil", label: "Profil Sekolah" },
  { id: "lembaga", label: "Data Lembaga" },
  { id: "visi", label: "Visi & Misi" },
  { id: "kontak", label: "Kontak" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function bentukLabel(value: string) {
  return BENTUK_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function statusLabel(value?: string) {
  if (value === "active") return "Aktif";
  if (value === "pending") return "Menunggu";
  if (value === "suspended") return "Ditangguhkan";
  return value || "—";
}

function akreditasiLabel(value: string) {
  if (value === "A") return "A (Sangat Baik)";
  if (value === "B") return "B (Baik)";
  if (value === "C") return "C (Cukup)";
  return value;
}

function mapsLink(p: SekolahProfil) {
  if (p.maps_url) return p.maps_url;
  if (p.latitude || p.longitude) {
    return `https://www.google.com/maps?q=${p.latitude},${p.longitude}`;
  }
  if (p.alamat) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.alamat)}`;
  }
  return "";
}

const num = (raw: FormDataEntryValue | null) => {
  const s = String(raw ?? "").trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export default function SekolahPage() {
  const router = useRouter();
  const [profil, setProfil] = useState<SekolahProfil | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<TabId>("profil");
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  async function persist(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const res = await patchJson<SekolahProfil>("/api/profil-sekolah", body);
    setSaving(false);
    if (!res.ok) {
      setError(res.error.message);
      return false;
    }
    setProfil(res.data);
    setLogo(res.data.logo ?? "");
    toast.success("Profil sekolah disimpan.");
    return true;
  }

  // persistNow=true dipakai tombol "Ubah Logo" (simpan langsung);
  // false dipakai form edit (logo ikut saat Simpan).
  async function handleLogo(
    event: React.ChangeEvent<HTMLInputElement>,
    persistNow: boolean,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError("Ukuran logo terlalu besar (maks ~1 MB).");
      return;
    }
    setError(null);
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, "logo");
      setLogo(url);
      if (persistNow) await persist({ logo: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleLogoutLogo() {
    setLogo("");
    await persist({ logo: "" });
  }

  if (loading || !profil) {
    return <p className="text-sm text-slate-400">Memuat profil sekolah…</p>;
  }

  const link = mapsLink(profil);
  const hasCoords = Boolean(profil.latitude || profil.longitude);

  return (
    <div className="space-y-5">
      {error ? <ErrorText>{error}</ErrorText> : null}

      {/* Kartu header: logo, nama, tab */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-epaud-sky via-white to-epaud-sky" />
        <div className="px-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <span className="-mt-10 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo || "/epaud-logo.png"}
                alt="Logo sekolah"
                className="h-14 w-auto object-contain"
              />
            </span>
            <div className="flex-1 pb-1">
              <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-epaud-navy">
                {profil.nama}
                <BadgeCheckIcon className="size-5 text-epaud-blue" />
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {profil.tagline || "Profil dan informasi lembaga."}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                <span>{bentukLabel(profil.tipe) || "Lembaga PAUD"}</span>
                <span aria-hidden>·</span>
                <span>{statusLabel(profil.status)}</span>
                <span aria-hidden>·</span>
                <span>NPSN {profil.npsn || "—"}</span>
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mb-2 flex h-10 items-center gap-2 rounded-xl bg-epaud-blue px-4 text-sm font-bold text-white transition hover:bg-epaud-blue-dark"
              >
                <PencilIcon className="size-4" />
                Edit Profil
              </button>
            ) : null}
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  tab === t.id
                    ? "border-epaud-blue text-epaud-blue"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {tab === "profil" ? <ProfilTab profil={profil} /> : null}
          {tab === "lembaga" ? <LembagaTab profil={profil} link={link} /> : null}
          {tab === "visi" ? <VisiMisiTab profil={profil} /> : null}
          {tab === "kontak" ? <KontakTab profil={profil} /> : null}
        </div>

        <div className="space-y-5">
          <SectionCard title="Logo Sekolah" icon={<ImageIcon className="size-5" />}>
            <div className="flex items-center gap-4">
              <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo || "/epaud-logo.png"}
                  alt="Logo sekolah"
                  className="h-16 w-auto object-contain"
                />
              </span>
              {canManage ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ImageIcon className="size-4" />
                    {uploadingLogo ? "Mengunggah…" : "Ubah Logo"}
                  </button>
                  <p className="text-[11px] text-slate-400">Format: JPG/PNG. Maks. 1 MB.</p>
                  {logo ? (
                    <button
                      type="button"
                      onClick={handleLogoutLogo}
                      className="block text-[11px] font-semibold text-rose-500 hover:underline"
                    >
                      Hapus logo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Kontak Sekolah" icon={<PhoneIcon className="size-5" />}>
            <div className="space-y-3 text-sm">
              <ContactRow
                icon={<PhoneIcon className="size-4" />}
                value={profil.telepon}
                href={profil.telepon ? `tel:${profil.telepon}` : undefined}
              />
              <ContactRow
                icon={<WhatsAppIcon className="size-4" />}
                value={profil.whatsapp}
                href={
                  profil.whatsapp
                    ? `https://wa.me/${profil.whatsapp.replace(/\D/g, "")}`
                    : undefined
                }
              />
              <ContactRow
                icon={<AtSignIcon className="size-4" />}
                value={profil.email}
                href={profil.email ? `mailto:${profil.email}` : undefined}
              />
              <ContactRow
                icon={<GlobeIcon className="size-4" />}
                value={profil.website}
                href={profil.website || undefined}
              />
            </div>
          </SectionCard>

          <SectionCard title="Lokasi Sekolah" icon={<MapPinIcon className="size-5" />}>
            {hasCoords ? (
              <iframe
                title="Lokasi sekolah"
                className="h-40 w-full rounded-xl border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${profil.longitude - 0.006},${profil.latitude - 0.004},${profil.longitude + 0.006},${profil.latitude + 0.004}&layer=mapnik&marker=${profil.latitude},${profil.longitude}`}
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-center text-xs text-slate-400">
                {profil.alamat || "Lokasi belum diatur."}
              </div>
            )}
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-epaud-blue hover:underline"
              >
                <MapPinIcon className="size-3.5" />
                Buka di Google Maps
              </a>
            ) : null}
          </SectionCard>

          {canManage ? (
            <SectionCard title="Aksi Cepat" icon={<StarIcon className="size-5" />}>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction
                  icon={<PencilIcon className="size-4" />}
                  label="Edit Profil"
                  onClick={() => setEditing(true)}
                />
                <QuickAction
                  icon={<ImageIcon className="size-4" />}
                  label="Ubah Logo"
                  onClick={() => logoInputRef.current?.click()}
                />
                <QuickAction
                  icon={<PhoneIcon className="size-4" />}
                  label="Kelola Kontak"
                  onClick={() => setTab("kontak")}
                />
                <QuickAction
                  icon={<MapPinIcon className="size-4" />}
                  label="Lihat di Peta"
                  onClick={() => link && window.open(link, "_blank", "noreferrer")}
                />
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>

      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleLogo(event, true)}
      />

      {editing ? (
        <ProfilForm
          profil={profil}
          logo={logo}
          saving={saving}
          error={error}
          onLogo={(event) => handleLogo(event, false)}
          uploadingLogo={uploadingLogo}
          onClose={() => {
            setEditing(false);
            setError(null);
          }}
          onSubmit={async (body) => {
            if (await persist(body)) setEditing(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ProfilTab({ profil }: { profil: SekolahProfil }) {
  return (
    <SectionCard title="Informasi Sekolah" icon={<BuildingIcon className="size-5" />}>
      <InfoRow label="Nama Sekolah">{profil.nama}</InfoRow>
      <InfoRow label="NPSN">{profil.npsn}</InfoRow>
      <InfoRow label="Jenis Lembaga">{bentukLabel(profil.tipe)}</InfoRow>
      <InfoRow label="Alamat">{profil.alamat}</InfoRow>
      <InfoRow label="Tipe">{profil.tipe ? <Badge tone="blue">{profil.tipe}</Badge> : null}</InfoRow>
      <InfoRow label="Status">
        <Badge tone={profil.status === "active" ? "green" : "amber"}>
          {statusLabel(profil.status)}
        </Badge>
      </InfoRow>
      <InfoRow label="Tahun Berdiri">{profil.tahun_berdiri || null}</InfoRow>
      <InfoRow label="Kepala Sekolah">{profil.kepala_sekolah}</InfoRow>
      <InfoRow label="Akreditasi">
        {profil.akreditasi ? (
          <span className="inline-flex items-center gap-2">
            <Badge tone="slate">{profil.akreditasi}</Badge>
            <span className="text-xs text-slate-400">({akreditasiLabel(profil.akreditasi)})</span>
          </span>
        ) : null}
      </InfoRow>
      <InfoRow label="Deskripsi">{profil.deskripsi}</InfoRow>
    </SectionCard>
  );
}

function LembagaTab({ profil, link }: { profil: SekolahProfil; link: string }) {
  return (
    <>
      <SectionCard title="Identitas Lembaga" icon={<BuildingIcon className="size-5" />}>
        <InfoRow label="Nama Lembaga">{profil.nama}</InfoRow>
        <InfoRow label="NPSN">{profil.npsn}</InfoRow>
        <InfoRow label="Bentuk Pendidikan">{bentukLabel(profil.tipe)}</InfoRow>
        <InfoRow label="Jenjang Pendidikan">{profil.jenjang}</InfoRow>
        <InfoRow label="Status Satuan">{profil.status_satuan}</InfoRow>
        <InfoRow label="Tahun Berdiri">{profil.tahun_berdiri || null}</InfoRow>
        <InfoRow label="Kepala/Pengelola">{profil.kepala_sekolah}</InfoRow>
        <InfoRow label="Akreditasi">
          {profil.akreditasi
            ? `${akreditasiLabel(profil.akreditasi)}${
                profil.tahun_akreditasi ? ` · ${profil.tahun_akreditasi}` : ""
              }`
            : null}
        </InfoRow>
      </SectionCard>

      <SectionCard title="Alamat Administratif" icon={<MapPinIcon className="size-5" />}>
        <InfoRow label="Alamat Jalan">{profil.alamat}</InfoRow>
        <InfoRow label="Latitude">{profil.latitude || null}</InfoRow>
        <InfoRow label="Longitude">{profil.longitude || null}</InfoRow>
        <InfoRow label="Google Maps">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-epaud-blue hover:underline"
            >
              Buka peta
            </a>
          ) : null}
        </InfoRow>
      </SectionCard>
    </>
  );
}

function VisiMisiTab({ profil }: { profil: SekolahProfil }) {
  const misi = Array.isArray(profil.misi) ? profil.misi : [];
  const nilai = Array.isArray(profil.nilai) ? profil.nilai : [];
  return (
    <>
      <SectionCard title="Visi" icon={<StarIcon className="size-5" />}>
        <p className="text-sm leading-relaxed text-slate-700">
          {profil.visi || <span className="text-slate-400">Belum diisi.</span>}
        </p>
      </SectionCard>

      <SectionCard title="Misi" icon={<BadgeCheckIcon className="size-5" />}>
        {misi.length === 0 ? (
          <p className="text-sm text-slate-400">Belum diisi.</p>
        ) : (
          <ol className="space-y-2.5">
            {misi.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm text-slate-700">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-epaud-sky text-xs font-bold text-epaud-blue">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard title="Motto & Nilai" icon={<StarIcon className="size-5" />}>
        <InfoRow label="Motto">{profil.motto}</InfoRow>
        <InfoRow label="Nilai Utama">
          {nilai.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              {nilai.map((item, index) => (
                <span
                  key={index}
                  className="rounded-full bg-epaud-sky px-2.5 py-0.5 text-xs font-semibold text-epaud-blue"
                >
                  {item}
                </span>
              ))}
            </span>
          ) : null}
        </InfoRow>
      </SectionCard>
    </>
  );
}

function KontakTab({ profil }: { profil: SekolahProfil }) {
  return (
    <SectionCard title="Kontak Utama" icon={<PhoneIcon className="size-5" />}>
      <InfoRow label="Nomor Telepon">
        {profil.telepon ? (
          <a href={`tel:${profil.telepon}`} className="hover:text-epaud-blue">
            {profil.telepon}
          </a>
        ) : null}
      </InfoRow>
      <InfoRow label="WhatsApp">
        {profil.whatsapp ? (
          <a
            href={`https://wa.me/${profil.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-epaud-blue"
          >
            {profil.whatsapp}
          </a>
        ) : null}
      </InfoRow>
      <InfoRow label="Email">
        {profil.email ? (
          <a href={`mailto:${profil.email}`} className="hover:text-epaud-blue">
            {profil.email}
          </a>
        ) : null}
      </InfoRow>
      <InfoRow label="Website">
        {profil.website ? (
          <a
            href={profil.website}
            target="_blank"
            rel="noreferrer"
            className="hover:text-epaud-blue"
          >
            {profil.website}
          </a>
        ) : null}
      </InfoRow>
    </SectionCard>
  );
}

function ProfilForm({
  profil,
  logo,
  saving,
  error,
  uploadingLogo,
  onLogo,
  onClose,
  onSubmit,
}: {
  profil: SekolahProfil;
  logo: string;
  saving: boolean;
  error: string | null;
  uploadingLogo: boolean;
  onLogo: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const [misi, setMisi] = useState<string[]>(
    Array.isArray(profil.misi) && profil.misi.length > 0 ? profil.misi : [""],
  );
  const [nilai, setNilai] = useState<string[]>(
    Array.isArray(profil.nilai) ? profil.nilai : [],
  );
  const [nilaiInput, setNilaiInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function addNilai() {
    const v = nilaiInput.trim();
    if (!v || nilai.includes(v)) {
      setNilaiInput("");
      return;
    }
    setNilai((list) => [...list, v]);
    setNilaiInput("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    if (!nama) {
      setFormError("Nama sekolah wajib diisi.");
      return;
    }
    const finalNilai = nilaiInput.trim()
      ? [...nilai, nilaiInput.trim()]
      : nilai;
    setFormError(null);
    onSubmit({
      nama,
      npsn: String(data.get("npsn") ?? "").trim(),
      tipe: String(data.get("tipe") ?? "").trim(),
      jenjang: String(data.get("jenjang") ?? "").trim(),
      status_satuan: String(data.get("status_satuan") ?? "").trim(),
      tahun_berdiri: num(data.get("tahun_berdiri")),
      kepala_sekolah: String(data.get("kepala_sekolah") ?? "").trim(),
      akreditasi: String(data.get("akreditasi") ?? "").trim(),
      tahun_akreditasi: num(data.get("tahun_akreditasi")),
      tagline: String(data.get("tagline") ?? "").trim(),
      deskripsi: String(data.get("deskripsi") ?? "").trim(),
      alamat: String(data.get("alamat") ?? "").trim(),
      latitude: num(data.get("latitude")),
      longitude: num(data.get("longitude")),
      maps_url: String(data.get("maps_url") ?? "").trim(),
      telepon: String(data.get("telepon") ?? "").trim(),
      whatsapp: String(data.get("whatsapp") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      website: String(data.get("website") ?? "").trim(),
      visi: String(data.get("visi") ?? "").trim(),
      motto: String(data.get("motto") ?? "").trim(),
      misi: misi.map((m) => m.trim()).filter(Boolean),
      nilai: finalNilai,
      logo,
    });
  }

  return (
    <Modal
      wide
      title="Edit Profil Sekolah"
      subtitle="Kelola identitas, kontak, lokasi, serta visi & misi lembaga."
      onClose={onClose}
    >
      <form className="mt-5 space-y-6" onSubmit={handleSubmit} noValidate>
        <FormSection title="Identitas">
          <div className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo || "/epaud-logo.png"} alt="Logo" className="h-12 w-auto object-contain" />
            </span>
            <label className="cursor-pointer text-sm font-semibold text-epaud-blue hover:underline">
              {uploadingLogo ? "Mengunggah…" : "Ganti logo"}
              <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
            </label>
          </div>

          <Field label="Nama sekolah *">
            <input name="nama" defaultValue={profil.nama} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NPSN">
              <input name="npsn" defaultValue={profil.npsn} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Bentuk pendidikan">
              <select name="tipe" defaultValue={profil.tipe} className={inputClass}>
                <option value="">— Pilih —</option>
                {BENTUK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jenjang pendidikan">
              <input name="jenjang" defaultValue={profil.jenjang || "PAUD"} className={inputClass} />
            </Field>
            <Field label="Status satuan">
              <select
                name="status_satuan"
                defaultValue={profil.status_satuan}
                className={inputClass}
              >
                {STATUS_SATUAN_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o || "— Pilih —"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tahun berdiri">
              <input
                name="tahun_berdiri"
                type="number"
                defaultValue={profil.tahun_berdiri || ""}
                className={inputClass}
              />
            </Field>
            <Field label="Kepala/Pengelola">
              <input name="kepala_sekolah" defaultValue={profil.kepala_sekolah} className={inputClass} />
            </Field>
            <Field label="Akreditasi">
              <select name="akreditasi" defaultValue={profil.akreditasi} className={inputClass}>
                {AKREDITASI_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o || "— Pilih —"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tahun akreditasi">
              <input
                name="tahun_akreditasi"
                type="number"
                defaultValue={profil.tahun_akreditasi || ""}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Tagline">
            <input
              name="tagline"
              defaultValue={profil.tagline}
              placeholder="Bersama tumbuh, belajar, dan meraih masa depan ceria"
              className={inputClass}
            />
          </Field>
          <Field label="Deskripsi singkat">
            <textarea name="deskripsi" defaultValue={profil.deskripsi} rows={3} className={inputClass} />
          </Field>
        </FormSection>

        <FormSection title="Alamat & Lokasi">
          <Field label="Alamat jalan">
            <textarea name="alamat" defaultValue={profil.alamat} rows={2} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <input
                name="latitude"
                type="number"
                step="any"
                defaultValue={profil.latitude || ""}
                placeholder="-6.xxxxx"
                className={inputClass}
              />
            </Field>
            <Field label="Longitude">
              <input
                name="longitude"
                type="number"
                step="any"
                defaultValue={profil.longitude || ""}
                placeholder="106.xxxxx"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Google Maps URL">
            <input name="maps_url" defaultValue={profil.maps_url} className={inputClass} />
          </Field>
        </FormSection>

        <FormSection title="Kontak">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telepon">
              <input name="telepon" defaultValue={profil.telepon} className={inputClass} />
            </Field>
            <Field label="WhatsApp">
              <input name="whatsapp" defaultValue={profil.whatsapp} className={inputClass} />
            </Field>
            <Field label="Email">
              <input name="email" type="email" defaultValue={profil.email} className={inputClass} />
            </Field>
            <Field label="Website">
              <input name="website" defaultValue={profil.website} className={inputClass} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Visi & Misi">
          <Field label="Visi">
            <textarea name="visi" defaultValue={profil.visi} rows={2} className={inputClass} />
          </Field>
          <div>
            <p className="pl-1 text-[13px] font-semibold text-slate-600">Misi</p>
            <div className="mt-2 space-y-2">
              {misi.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-epaud-sky text-xs font-bold text-epaud-blue">
                    {index + 1}
                  </span>
                  <input
                    value={item}
                    onChange={(event) =>
                      setMisi((list) =>
                        list.map((v, i) => (i === index ? event.target.value : v)),
                      )
                    }
                    className={inputClass}
                    placeholder="Tulis misi…"
                  />
                  <button
                    type="button"
                    aria-label="Hapus misi"
                    onClick={() => setMisi((list) => list.filter((_, i) => i !== index))}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-rose-500"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMisi((list) => [...list, ""])}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-epaud-blue hover:underline"
            >
              <PlusIcon className="size-3.5" />
              Tambah Misi
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Motto">
              <input name="motto" defaultValue={profil.motto} className={inputClass} />
            </Field>
            <div>
              <p className="pl-1 text-[13px] font-semibold text-slate-600">Nilai utama</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={nilaiInput}
                  onChange={(event) => setNilaiInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addNilai();
                    }
                  }}
                  placeholder="Ceria, mandiri, kreatif…"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addNilai}
                  className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Tambah
                </button>
              </div>
              {nilai.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {nilai.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNilai((list) => list.filter((_, i) => i !== index))}
                      className="inline-flex items-center gap-1 rounded-full bg-epaud-sky px-2.5 py-1 text-xs font-semibold text-epaud-blue"
                    >
                      {item}
                      <XIcon className="size-3" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </FormSection>

        {formError || error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            {formError ?? error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonGhost}>
            Batal
          </button>
          <button type="submit" disabled={saving} className={buttonPrimary}>
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2.5 text-sm font-bold text-epaud-navy">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-epaud-sky text-epaud-blue">
          {icon}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children?: ReactNode }) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center">
      <span className="w-full shrink-0 text-sm text-slate-400 sm:w-44">{label}</span>
      <span className="text-sm font-medium text-slate-700">
        {empty ? <span className="text-slate-300">—</span> : children}
      </span>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "blue" | "green" | "amber" | "slate";
  children: ReactNode;
}) {
  const tones = {
    blue: "bg-epaud-sky text-epaud-blue",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ContactRow({
  icon,
  value,
  href,
}: {
  icon: ReactNode;
  value?: string;
  href?: string;
}) {
  if (!value) {
    return (
      <p className="flex items-center gap-2 text-slate-300">
        <span className="text-slate-300">{icon}</span>
        Belum diisi
      </p>
    );
  }
  const content = (
    <span className="flex items-center gap-2 text-slate-700">
      <span className="text-epaud-blue">{icon}</span>
      <span className="break-all">{value}</span>
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:text-epaud-blue">
      {content}
    </a>
  ) : (
    content
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-2 py-3 text-xs font-semibold text-slate-600 transition hover:border-epaud-blue/30 hover:bg-white hover:text-epaud-blue"
    >
      <span className="text-epaud-blue">{icon}</span>
      {label}
    </button>
  );
}
