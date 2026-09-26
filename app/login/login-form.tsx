"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { PasswordField, TextField } from "@/components/form-fields";
import { ArrowRightIcon, CheckIcon, GoogleIcon, UserIcon } from "@/components/icons";

export function LoginForm({ registered = false }: { registered?: boolean }) {
  const router = useRouter();
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!identifier || !password) {
      setError("Username/email dan password wajib diisi.");
      return;
    }

    setError(null);

    // Belum ada backend: simpan sesi tiruan lalu arahkan ke panel.
    try {
      window.sessionStorage.setItem(
        "epaud:session",
        JSON.stringify({ identifier, at: Date.now() }),
      );
    } catch {
      // abaikan bila storage tidak tersedia
    }

    router.push("/panel");
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

      <form className="mt-7 space-y-5 sm:mt-9" onSubmit={handleSubmit} noValidate>
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
          <a
            href="#"
            className="text-sm font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
          >
            Lupa password?
          </a>
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
          className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-epaud-blue px-6 text-base font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/30 active:scale-[0.99]"
        >
          Masuk
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
        className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/15"
      >
        <GoogleIcon className="size-5" />
        Masuk dengan Google
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
    </AuthCard>
  );
}
