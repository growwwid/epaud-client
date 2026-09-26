"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ArrowRightIcon } from "@/components/icons";
import {
  clearPendingRegistration,
  maskContact,
  PENDING_REGISTRATION_KEY,
  type PendingRegistration,
} from "@/components/registration";

const OTP_LENGTH = 4;
const OTP_TTL = 120; // 2 menit

function subscribe() {
  return () => {};
}

function getPendingSnapshot() {
  try {
    return window.sessionStorage.getItem(PENDING_REGISTRATION_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot() {
  return null;
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function OtpForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [secondsLeft, setSecondsLeft] = useState(OTP_TTL);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const completedRef = useRef(false);

  const hydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const rawPending = useSyncExternalStore(
    subscribe,
    getPendingSnapshot,
    getServerSnapshot,
  );

  const pending = useMemo<PendingRegistration | null>(() => {
    if (!rawPending) return null;
    try {
      return JSON.parse(rawPending) as PendingRegistration;
    } catch {
      return null;
    }
  }, [rawPending]);

  const contact = pending?.contact ?? null;

  // Wajib ada data pendaftaran; kalau tidak, kembali ke halaman daftar.
  useEffect(() => {
    if (hydrated && !pending && !completedRef.current) {
      router.replace("/register");
    }
  }, [hydrated, pending, router]);

  // Hitung mundur masa berlaku OTP (2 menit).
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(
      () => setSecondsLeft((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const expired = secondsLeft <= 0;

  function focusInput(index: number) {
    inputsRef.current[index]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    setError(null);

    if (!value) {
      setDigits((prev) => prev.map((digit, i) => (i === index ? "" : digit)));
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      value.split("").forEach((char, offset) => {
        if (index + offset < OTP_LENGTH) next[index + offset] = char;
      });
      return next;
    });

    focusInput(Math.min(index + value.length, OTP_LENGTH - 1));
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) focusInput(index - 1);
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, () => "");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  function handleResend() {
    setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
    setSecondsLeft(OTP_TTL);
    setError(null);
    setInfo("Kode OTP baru telah dikirim.");
    focusInput(0);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join("");

    if (expired) {
      setError("Kode OTP sudah kedaluwarsa. Silakan kirim ulang kode.");
      return;
    }
    if (code.length < OTP_LENGTH) {
      setError("Masukkan 4 digit kode OTP.");
      return;
    }

    setError(null);
    // Belum ada backend: kode 4 digit apa pun dianggap valid.
    completedRef.current = true;
    clearPendingRegistration();
    router.push("/login?registered=1");
  }

  return (
    <AuthCard>
      <header>
        <h2 className="text-[1.6rem] font-extrabold tracking-tight text-epaud-navy sm:text-3xl">
          Verifikasi OTP
        </h2>
        <p className="mt-2.5 text-sm text-slate-500 sm:text-base">
          Kode 4 digit telah dikirim ke{" "}
          <span className="font-semibold text-epaud-navy">
            {contact ? maskContact(contact) : "email/WhatsApp Anda"}
          </span>
          .
        </p>
      </header>

      <form className="mt-8" onSubmit={handleSubmit} noValidate>
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 1fr))` }}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              aria-label={`Digit OTP ${index + 1}`}
              className={`h-14 w-full rounded-2xl border bg-white text-center text-xl font-bold text-epaud-navy outline-none transition focus:ring-4 ${
                error
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-epaud-blue focus:ring-epaud-blue/10"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          {expired ? (
            <span className="font-medium text-red-500">
              Kode sudah kedaluwarsa.
            </span>
          ) : (
            <span className="text-slate-500">
              Kode berlaku{" "}
              <span className="font-semibold tabular-nums text-epaud-navy">
                {formatTime(secondsLeft)}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={!expired}
            className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
          >
            Kirim ulang kode
          </button>
        </div>

        {info ? (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700"
          >
            {info}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={expired}
          className="group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-epaud-blue px-6 text-base font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-epaud-blue/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          Verifikasi
          <ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-7 flex flex-col items-center gap-2 text-sm text-slate-500">
        <Link
          href="/register"
          className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
        >
          Ubah data pendaftaran
        </Link>
        <span>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-epaud-blue transition hover:text-epaud-blue-dark hover:underline"
          >
            Masuk
          </Link>
        </span>
      </div>
    </AuthCard>
  );
}
