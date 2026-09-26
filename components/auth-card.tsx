import type { ReactNode } from "react";

export function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`w-full max-w-[500px] rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-35px_rgba(23,53,107,0.45)] ring-1 ring-slate-100 sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
