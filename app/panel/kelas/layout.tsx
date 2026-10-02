import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Kelas" };

export default function KelasLayout({ children }: { children: ReactNode }) {
  return children;
}
