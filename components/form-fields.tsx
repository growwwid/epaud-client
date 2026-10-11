"use client";

import { useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDownIcon, EyeIcon, EyeOffIcon, LockIcon, RefreshIcon } from "./icons";
import { PasswordStrength, generatePassword } from "./password-input";

const baseField =
  "h-14 w-full rounded-2xl border bg-white text-[15px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50";

function fieldClasses(hasError: boolean) {
  return hasError
    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
    : "border-slate-200 focus:border-epaud-blue focus:ring-epaud-blue/10";
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="pl-1 text-[13px] font-medium text-red-500">{error}</p>;
}

type TextFieldProps = {
  id: string;
  label: string;
  icon?: ReactNode;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextField({
  id,
  label,
  icon,
  error,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          className={`${baseField} ${fieldClasses(Boolean(error))} ${icon ? "pl-12" : "pl-4"} pr-4 ${className}`}
          {...props}
        />
      </div>
      <FieldError error={error} />
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  error?: string;
  showStrength?: boolean;
  showGenerate?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export function PasswordField({
  id,
  label,
  error,
  className = "",
  showStrength = false,
  showGenerate = false,
  defaultValue,
  onChange,
  ...props
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState(String(defaultValue ?? ""));
  const inputRef = useRef<HTMLInputElement>(null);

  function setPassword(next: string) {
    setValue(next);
    if (inputRef.current) inputRef.current.value = next;
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <LockIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          id={id}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          defaultValue={defaultValue}
          onChange={(event) => {
            setValue(event.target.value);
            onChange?.(event);
          }}
          className={`${baseField} ${fieldClasses(Boolean(error))} pl-12 pr-14 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-epaud-blue/40"
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
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-epaud-blue hover:underline"
        >
          <RefreshIcon className="size-4" />
          Generate password
        </button>
      ) : null}
      {showStrength && value ? <PasswordStrength value={value} /> : null}
      <FieldError error={error} />
    </div>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  icon?: ReactNode;
  error?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({
  id,
  label,
  icon,
  error,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          className={`${baseField} ${fieldClasses(Boolean(error))} appearance-none ${icon ? "pl-12" : "pl-4"} pr-11 ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
      </div>
      <FieldError error={error} />
    </div>
  );
}
