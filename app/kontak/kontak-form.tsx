"use client";

import { useState } from "react";
import Link from "next/link";
import { postJson } from "@/components/api";
import { AuthCard } from "@/components/auth-card";
import { SelectField, TextField } from "@/components/form-fields";
import {
  ArrowRightIcon,
  AtSignIcon,
  FileIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";

const KATEGORI = [
  { value: "verifikasi", label: "Verifikasi / OTP" },
  { value: "login", label: "Tidak bisa login" },
  { value: "data", label: "Data sekolah/murid salah" },
  { value: "teknis", label: "Kendala teknis" },
  { value: "lainnya", label: "Lainnya" },
];

export function KontakForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const kategori = String(data.get("kategori") ?? "").trim();
    const judul = String(data.get("judul") ?? "").trim();
    const deskripsi = String(data.get("deskripsi") ?? "").trim();

    if (!nama || !judul || !deskripsi) {
      setError("Nama, judul, dan deskripsi wajib diisi.");
      return;
    }
    if (!email && !phone) {
      setError("Isi minimal salah satu kontak: email atau nomor HP.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await postJson("/api/kontak", {
      nama,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      kategori,
      judul,
      deskripsi,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthCard>
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <FileIcon className="size-7" />
          </span>
          <h2 className="mt-5 text-[1.5rem] font-extrabold tracking-tight text-epaud-navy">
            Laporan Terkirim
          </h2>
          <p className="mt-2.5 text-sm text-slate-500">
            Terima kasih. Tim kami akan menindaklanjuti laporan Anda melalui
            kontak yang Anda berikan.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark"
          >
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <header>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight text-epaud-navy sm:text-3xl">
          Hubungi Kami
        </h2>
        <p className="mt-2.5 text-sm text-slate-500 sm:text-base">
          Sampaikan kendala Anda. Tidak perlu masuk untuk melapor.
        </p>
      </header>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <TextField
          id="nama"
          name="nama"
          label="Nama"
          placeholder="Nama lengkap"
          icon={<UserIcon className="size-5" />}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="email@contoh.id"
            autoComplete="email"
            icon={<AtSignIcon className="size-5" />}
          />
          <TextField
            id="phone"
            name="phone"
            type="tel"
            label="Nomor HP"
            placeholder="08xxxxxxxxxx"
            autoComplete="tel"
            icon={<PhoneIcon className="size-5" />}
          />
        </div>

        <SelectField id="kategori" name="kategori" label="Kategori">
          {KATEGORI.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>

        <TextField
          id="judul"
          name="judul"
          label="Judul"
          placeholder="Ringkasan kendala"
        />

        <div className="space-y-1.5">
          <label htmlFor="deskripsi" className="sr-only">
            Deskripsi
          </label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            rows={4}
            placeholder="Jelaskan kendala Anda secara detail..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-epaud-blue px-6 text-base font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {submitting ? "Mengirim..." : "Kirim Laporan"}
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-7 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
        >
          Masuk
        </Link>
      </div>
    </AuthCard>
  );
}
