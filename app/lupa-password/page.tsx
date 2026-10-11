import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/epaud";
import { LupaPasswordForm } from "./lupa-password-form";

export const metadata: Metadata = {
  title: "Lupa Password — ePAUD",
  description: "Atur ulang password akun ePAUD Anda.",
};

export default async function LupaPasswordPage() {
  const jar = await cookies();
  if (jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE)) {
    redirect("/panel");
  }

  return (
    <AuthShell
      heading={
        <>
          Kembali Akses
          <br />
          Akun Anda
        </>
      }
      description="Masukkan email atau nomor HP terdaftar untuk menerima kode verifikasi dan mengatur ulang password."
    >
      <LupaPasswordForm />
    </AuthShell>
  );
}
