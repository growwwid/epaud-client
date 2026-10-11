import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Absensi" };

export default function AbsensiLayout({ children }: { children: ReactNode }) {
  return children;
}
