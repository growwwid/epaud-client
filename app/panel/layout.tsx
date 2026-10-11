import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { MeResult, SekolahProfil } from "@/components/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, apiFetch, bearer } from "@/lib/epaud";
import { PanelShell } from "./panel-shell";

async function fetchData<T>(path: string, access: string): Promise<T | null> {
  try {
    const res = await apiFetch(path, { headers: bearer(access) });
    if (!res.ok) return null;
    const payload = await res.json();
    return (payload?.data ?? payload) as T;
  } catch {
    return null;
  }
}

/**
 * Data sekolah/akun dipakai bersama oleh `generateMetadata` dan layout.
 * `cache` membuat satu request hanya fetch sekali. Sengaja pakai `apiFetch`
 * polos (bukan authedProxy) agar render RSC tidak memutar refresh token.
 */
const getPanelData = cache(async () => {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (!access) return { me: null, profil: null };
  const me = await fetchData<MeResult>("/api/v1/auth/me", access);
  const profil =
    me && me.role !== "superadmin"
      ? await fetchData<SekolahProfil>("/api/v1/profil-sekolah", access)
      : null;
  return { me, profil };
});

export async function generateMetadata(): Promise<Metadata> {
  const { me, profil } = await getPanelData();
  const nama = profil?.nama ?? me?.nama_sekolah ?? "ePAUD";
  return {
    title: {
      default: `Dashboard - ${nama}`,
      template: `%s - ${nama}`,
    },
    description: "Panel administrasi ePAUD.",
  };
}

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) {
    redirect("/login");
  }

  const { me, profil } = await getPanelData();

  return (
    <PanelShell initialMe={me} initialProfil={profil}>
      {children}
    </PanelShell>
  );
}
