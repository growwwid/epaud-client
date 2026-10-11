import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Tabungan" };

export default function TabunganLayout({ children }: { children: ReactNode }) {
  return children;
}
