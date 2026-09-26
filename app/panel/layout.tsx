import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PanelShell } from "./panel-shell";

export const metadata: Metadata = {
  title: "Panel — ePAUD",
  description: "Panel administrasi ePAUD.",
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
