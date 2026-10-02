import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Orang Tua" };

export default function OrangTuaLayout({ children }: { children: ReactNode }) {
  return children;
}
