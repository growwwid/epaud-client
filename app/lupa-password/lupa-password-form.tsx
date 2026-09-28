"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/components/api";
import { AuthCard } from "@/components/auth-card";
import { PasswordField, TextField } from "@/components/form-fields";
import { ArrowRightIcon, HashIcon, LockIcon, UserIcon } from "@/components/icons";
import { maskContact } from "@/components/registration";

type LupaPasswordResult = {
  kanal: string;
  tujuan: string;
  otp?: string;
  expires_in: number;
};

export function LupaPasswordForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState<LupaPasswordResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const expired = sent ? secondsLeft <= 0 : false;

  const contactPayload = () =>
    identifier.includes("@")
      ? { email: identifier }
      : { phone: identifier };

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError("Masukkan email atau nomor HP akun Anda.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await postJson<LupaPasswordResult>("/api/auth/lupa-password", {
      ...(value.includes("@") ? { email: value } : { phone: value }),
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setSent(result.data);
    setSecondsLeft(result.data.expires_in || 180);
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const kode = String(data.get("kode") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (expired) {
      setError("Kode sudah kedaluwarsa. Minta kode baru.");
      return;
    }
    if (!kode) {
      setError("Masukkan kode verifikasi yang dikirim.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const result = await postJson("/api/auth/reset-password", {
      ...contactPayload(),
      kode,
      password,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    router.push("/login?reset=1");
  }

  return (
    <AuthCard>
      <header>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight text-epaud-navy sm:text-3xl">
          {sent ? "Atur Ulang Password" : "Lupa Password"}
        </h2>
        <p className="mt-2.5 text-sm text-slate-500 sm:text-base">
          {sent ? (
            <>
              Kode 4 digit dikirim ke{" "}
              <span className="font-semibold text-epaud-navy">
                {maskContact(sent.tujuan)}
              </span>
              .
            </>
          ) : (
            "Masukkan email atau nomor HP akun, kami akan mengirim kode verifikasi."
          )}
        </p>
      </header>

      {!sent ? (
        <form className="mt-8 space-y-5" onSubmit={handleRequest} noValidate>
          <TextField
            id="identifier"
            name="identifier"
            label="Email atau Nomor HP"
            placeholder="email@contoh.id atau 08xxxxxxxxxx"
            autoComplete="username"
            icon={<UserIcon className="size-5" />}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />

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
            {submitting ? "Mengirim..." : "Kirim Kode"}
            <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleReset} noValidate>
          <TextField
            id="kode"
            name="kode"
            label="Kode Verifikasi"
            placeholder="4 digit kode"
            inputMode="numeric"
            maxLength={4}
            autoComplete="one-time-code"
            icon={<HashIcon className="size-5" />}
          />
          <PasswordField
            id="password"
            name="password"
            label="Password Baru"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm"
            name="confirm"
            label="Konfirmasi Password"
            placeholder="Ulangi password baru"
            autoComplete="new-password"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {expired ? (
              <span className="font-medium text-red-500">
                Kode sudah kedaluwarsa.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <LockIcon className="size-4" />
                Berlaku{" "}
                <span className="font-semibold tabular-nums text-epaud-navy">
                  {Math.floor(secondsLeft / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(secondsLeft % 60).toString().padStart(2, "0")}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setSent(null);
                setError(null);
              }}
              className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
            >
              Kirim ulang kode
            </button>
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
            disabled={submitting || expired}
            className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-epaud-blue px-6 text-base font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {submitting ? "Menyimpan..." : "Simpan Password"}
            <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </form>
      )}

      <div className="mt-7 text-center text-sm text-slate-500">
        Ingat password Anda?{" "}
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
