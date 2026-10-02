import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Guru" };

export default function GuruLayout({ children }: { children: ReactNode }) {
  return children;
}
