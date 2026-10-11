"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJson } from "@/components/api";
import { AuthCard } from "@/components/auth-card";
import { PasswordField, TextField } from "@/components/form-fields";
import { ArrowRightIcon, CheckIcon, GoogleIcon, UserIcon } from "@/components/icons";
import { savePendingRegistration } from "@/components/registration";

export function LoginForm({
  registered = false,
  reset = false,
}: {
  registered?: boolean;
  reset?: boolean;
}) {
  const router = useRouter();
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/google");
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.data?.url) {
        setError(
          payload?.error?.message ?? "Login Google belum dikonfigurasi.",
        );
        setGoogleLoading(false);
        return;
      }
      window.location.href = payload.data.url as string;
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
      setGoogleLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    event.preventDefault();
    event.currentTarget.requestSubmit();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!identifier || !password) {
      setError("Username/email dan password wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const isEmail = identifier.includes("@");
    const result = await postJson("/api/auth/login", {
      ...(isEmail ? { email: identifier } : { phone: identifier }),
      password,
      remember,
    });

    if (result.ok) {
      router.push("/panel");
      router.refresh();
      return;
    }

    setSubmitting(false);

    const details = result.error.details as
      | { sekolah_id?: string; kanal?: string; tujuan?: string }
      | null;
    // Sekolah belum aktif: arahkan ke verifikasi OTP.
    if (result.error.code === "school_not_active" && details?.sekolah_id) {
      savePendingRegistration({
        schoolId: details.sekolah_id,
        kanal: details.kanal ?? "email",
        tujuan: details.tujuan ?? identifier,
        expiresIn: 180,
      });
      router.push("/register/verifikasi");
      return;
    }

    setError(result.error.message);
  }

  return (
    <AuthCard>
      <header>
        <h2 className="text-[1.75rem] font-extrabold tracking-tight text-epaud-navy sm:text-4xl">
          Selamat Datang <span aria-hidden="true">👋</span>
        </h2>
        <p className="mt-2.5 text-sm text-slate-500 sm:text-base">
          Silakan masuk ke akun ePAUD Anda
        </p>
      </header>

      {registered ? (
        <p
          role="status"
          className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"
        >
          Registrasi berhasil. Silakan masuk dengan akun Anda.
        </p>
      ) : null}

      {reset ? (
        <p
          role="status"
          className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"
        >
          Password berhasil diubah. Silakan masuk dengan password baru.
        </p>
      ) : null}

      <form
        className="mt-7 space-y-5 sm:mt-9"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        noValidate
      >
        <TextField
          id="identifier"
          name="identifier"
          label="Username atau Email"
          placeholder="Username atau Email"
          autoComplete="username"
          icon={<UserIcon className="size-5" />}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="Password"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-4 pt-0.5">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-600">
            <span className="relative flex size-5 items-center justify-center">
              <input
                type="checkbox"
                name="remember"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-slate-300 transition checked:border-epaud-blue checked:bg-epaud-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-epaud-blue/40"
              />
              <CheckIcon className="pointer-events-none absolute size-3.5 text-white opacity-0 transition peer-checked:opacity-100" />
            </span>
            Ingat saya
          </label>
          <Link
            href="/lupa-password"
            className="text-sm font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
          >
            Lupa password?
          </Link>
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
          {submitting ? "Memproses..." : "Masuk"}
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-7 flex items-center gap-4 text-sm font-medium text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        atau
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/15 disabled:opacity-60"
      >
        <GoogleIcon className="size-5" />
        {googleLoading ? "Mengalihkan…" : "Masuk dengan Google"}
      </button>

      <p className="mt-7 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
        >
          Daftarkan sekolah Anda
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-slate-500">
        Mengalami kendala?{" "}
        <Link
          href="/kontak"
          className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
        >
          Hubungi kami
        </Link>
      </p>
    </AuthCard>
  );
}
