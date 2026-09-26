"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { PasswordField, SelectField, TextField } from "@/components/form-fields";
import {
  ArrowRightIcon,
  AtSignIcon,
  BuildingIcon,
  GridIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import { savePendingRegistration } from "@/components/registration";

const SCHOOL_TYPES = ["TK", "RA", "KB", "TPA", "SPS"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s]{9,16}$/;

type ContactType = "email" | "phone";

export function RegisterForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactType, setContactType] = useState<ContactType>("email");

  const isEmail = contactType === "email";
  const contactLabel = isEmail ? "Email" : "Nomor Telepon";
  const contactPlaceholder = isEmail ? "Email" : "Nomor Telepon";

  function changeContactType(type: ContactType) {
    setContactType(type);
    setErrors((prev) => {
      if (!prev.contact) return prev;
      const next = { ...prev };
      delete next.contact;
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const schoolName = String(data.get("schoolName") ?? "").trim();
    const headmasterName = String(data.get("headmasterName") ?? "").trim();
    const contact = String(data.get("contact") ?? "").trim();
    const schoolType = String(data.get("schoolType") ?? "");
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const next: Record<string, string> = {};

    if (!schoolName) next.schoolName = "Nama sekolah wajib diisi.";
    if (!headmasterName)
      next.headmasterName = "Nama kepala sekolah wajib diisi.";

    if (!contact) {
      next.contact = isEmail ? "Email wajib diisi." : "Nomor telepon wajib diisi.";
    } else if (isEmail) {
      if (!EMAIL_PATTERN.test(contact)) {
        next.contact = "Format email tidak valid.";
      }
    } else if (!PHONE_PATTERN.test(contact)) {
      next.contact = "Format nomor telepon tidak valid.";
    }

    if (!schoolType) next.schoolType = "Pilih jenis sekolah.";
    if (password.length < 8) next.password = "Password minimal 8 karakter.";
    if (confirmPassword !== password) {
      next.confirmPassword = "Konfirmasi password tidak cocok.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    savePendingRegistration({
      schoolName,
      headmasterName,
      contact,
      schoolType,
    });
    router.push("/register/verifikasi");
  }

  return (
    <AuthCard>
      <header>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight text-epaud-navy sm:text-3xl">
          Daftar Akun ePAUD
        </h2>
        <p className="mt-2.5 text-sm text-slate-500 sm:text-base">
          Lengkapi data sekolah untuk membuat akun.
        </p>
      </header>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
        <TextField
          id="schoolName"
          name="schoolName"
          label="Nama Sekolah"
          placeholder="Nama Sekolah"
          autoComplete="organization"
          icon={<BuildingIcon className="size-5" />}
          error={errors.schoolName}
        />

        <TextField
          id="headmasterName"
          name="headmasterName"
          label="Nama Kepala Sekolah"
          placeholder="Nama Kepala Sekolah"
          autoComplete="name"
          icon={<UserIcon className="size-5" />}
          error={errors.headmasterName}
        />

        <div className="space-y-2">
          <div className="flex justify-end">
            <div
              role="group"
              aria-label="Pilih metode kontak"
              className="inline-flex rounded-xl bg-slate-100 p-1"
            >
              <button
                type="button"
                aria-pressed={isEmail}
                onClick={() => changeContactType("email")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isEmail
                    ? "bg-white text-epaud-blue shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                aria-pressed={!isEmail}
                onClick={() => changeContactType("phone")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  !isEmail
                    ? "bg-white text-epaud-blue shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Nomor Telepon
              </button>
            </div>
          </div>

          <TextField
            id="contact"
            name="contact"
            label={contactLabel}
            placeholder={contactPlaceholder}
            type={isEmail ? "email" : "tel"}
            inputMode={isEmail ? "email" : "tel"}
            autoComplete={isEmail ? "email" : "tel"}
            icon={
              isEmail ? (
                <AtSignIcon className="size-5" />
              ) : (
                <PhoneIcon className="size-5" />
              )
            }
            error={errors.contact}
          />
        </div>

        <SelectField
          id="schoolType"
          name="schoolType"
          label="Jenis Sekolah"
          defaultValue=""
          icon={<GridIcon className="size-5" />}
          error={errors.schoolType}
        >
          <option value="" disabled>
            Jenis Sekolah
          </option>
          {SCHOOL_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </SelectField>

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Password"
          autoComplete="new-password"
          error={errors.password}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Konfirmasi Password"
          placeholder="Konfirmasi Password"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <button
          type="submit"
          className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-epaud-blue px-6 text-base font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/30 active:scale-[0.99]"
        >
          Daftar
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthCard>
  );
}
