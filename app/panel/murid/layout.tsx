import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Murid" };

export default function MuridLayout({ children }: { children: ReactNode }) {
  return children;
}
