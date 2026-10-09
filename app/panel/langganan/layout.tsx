import { redirect } from "next/navigation";
import type { ReactNode } from "react";

// Sistem langganan dinonaktifkan sementara.
export default function LanggananLayout({ children }: { children: ReactNode }) {
  redirect("/panel");
  return children;
}
