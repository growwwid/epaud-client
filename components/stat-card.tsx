import type { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-epaud-sky text-epaud-blue">
          {icon}
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-epaud-navy">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
