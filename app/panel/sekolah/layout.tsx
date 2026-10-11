import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Sekolah" };

export default function SekolahLayout({ children }: { children: ReactNode }) {
  return children;
}
