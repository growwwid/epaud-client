import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Kelola Sekolah" };

export default function KelolaSekolahLayout({ children }: { children: ReactNode }) {
  return children;
}
