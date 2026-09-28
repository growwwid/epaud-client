"use client";

import { useRef, useState } from "react";
import { EyeIcon, EyeOffIcon, RefreshIcon } from "./icons";

export const PASSWORD_MIN = 8;

export type PasswordCheck = {
  key: string;
  label: string;
  ok: boolean;
};

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { key: "length", label: `Minimal ${PASSWORD_MIN} karakter`, ok: value.length >= PASSWORD_MIN },
    { key: "lower", label: "Huruf kecil", ok: /[a-z]/.test(value) },
    { key: "upper", label: "Huruf besar", ok: /[A-Z]/.test(value) },
    { key: "digit", label: "Angka", ok: /\d/.test(value) },
  ];
}

export function passwordScore(value: string): number {
  return passwordChecks(value).filter((c) => c.ok).length;
}

export function generatePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digit = "23456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + digit + symbols;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(upper), pick(lower), pick(digit), pick(symbols)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const LEVEL = [
  { label: "Sangat lemah", color: "bg-rose-500" },
  { label: "Lemah", color: "bg-rose-400" },
  { label: "Sedang", color: "bg-amber-400" },
  { label: "Kuat", color: "bg-emerald-500" },
  { label: "Sangat kuat", color: "bg-emerald-600" },
];

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const level = value ? LEVEL[score] : null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              value && score > i ? level!.color : "bg-slate-200"
            }`}
          />
        ))}
        {level ? (
          <span className="ml-1 text-[11px] font-semibold text-slate-500">
            {level.label}
          </span>
        ) : null}
      </div>
      <ul className="grid grid-cols-2 gap-1">
        {passwordChecks(value).map((c) => (
          <li
            key={c.key}
            className={`text-[11px] font-medium ${c.ok ? "text-emerald-600" : "text-slate-400"}`}
          >
            {c.ok ? "✓" : "•"} {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

type PasswordInputProps = {
  name: string;
  className: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  showStrength?: boolean;
  showGenerate?: boolean;
  autoComplete?: string;
};

/**
 * Input password untuk form master: toggle show/hide, indikator kekuatan,
 * kriteria, dan tombol generate. Nilai dibaca lewat FormData (uncontrolled).
 */
export function PasswordInput({
  name,
  className,
  defaultValue = "",
  placeholder,
  hint,
  showStrength = true,
  showGenerate = true,
  autoComplete,
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(defaultValue);

  function setPassword(next: string) {
    setValue(next);
    if (inputRef.current) inputRef.current.value = next;
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          name={name}
          type={show ? "text" : "password"}
          className={`${className} pr-12`}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-600"
        >
          {show ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      </div>

      {showGenerate ? (
        <button
          type="button"
          onClick={() => {
            setPassword(generatePassword());
            setShow(true);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-epaud-blue hover:underline"
        >
          <RefreshIcon className="size-4" />
          Generate password
        </button>
      ) : null}

      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      {showStrength && value ? <PasswordStrength value={value} /> : null}
    </div>
  );
}