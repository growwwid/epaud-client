import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Langganan" };

export default function LanggananLayout({ children }: { children: ReactNode }) {
  return children;
}
