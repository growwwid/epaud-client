import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Tahun Ajaran" };

export default function TahunAjaranLayout({ children }: { children: ReactNode }) {
  return children;
}
