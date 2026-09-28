"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, XIcon } from "./icons";

export const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10";

export const buttonPrimary =
  "h-11 rounded-xl bg-epaud-blue px-6 text-sm font-bold text-white shadow-lg shadow-epaud-blue/25 transition hover:bg-epaud-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none";

export const buttonGhost =
  "h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  // Dukung label lama yang sudah berakhiran " *" agar tanda bintang otomatis
  // berwarna merah tanpa perlu mengubah seluruh pemanggil.
  const needsStar = required || /\s\*$/.test(label);
  const text = needsStar ? label.replace(/\s*\*$/, "") : label;
  return (
    <label className="block space-y-1.5">
      <span className="pl-1 text-[13px] font-semibold text-slate-600">
        {text}
        {needsStar ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-epaud-sky to-white p-5 sm:p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-epaud-blue shadow-sm">
        {icon}
      </span>
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-epaud-navy sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * OptionalFields menyembunyikan input opsional di balik tombol "Tampilkan
 * informasi lainnya" agar form hanya menampilkan field wajib secara default.
 */
export function OptionalFields({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-slate-600 transition hover:text-epaud-blue"
      >
        Tampilkan informasi lainnya
        <ChevronDownIcon
          className={`size-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-slate-100 p-4">{children}</div>
      ) : null}
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (children) toast.error(String(children));
  }, [children]);
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
    >
      {children}
    </p>
  );
}

export function Notice({ children }: { children: ReactNode; onClose?: () => void }) {
  useEffect(() => {
    if (children) toast.success(String(children));
  }, [children]);
  return null;
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <div
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-epaud-navy">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
          >
            <XIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const tableHeadClass =
  "text-xs font-bold uppercase tracking-wide text-slate-400";

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-400"
      >
        {label}
      </td>
    </tr>
  );
}
