import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/epaud";
import { PanelShell } from "./panel-shell";

export const metadata: Metadata = {
  title: "Panel — ePAUD",
  description: "Panel administrasi ePAUD.",
};

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) {
    redirect("/login");
  }

  return <PanelShell>{children}</PanelShell>;
}
