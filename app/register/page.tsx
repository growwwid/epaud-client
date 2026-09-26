import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar — ePAUD",
  description: "Daftarkan sekolah Anda untuk membuat akun ePAUD.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      heading={
        <>
          Daftarkan Sekolah
          <br />
          Anda Sekarang
        </>
      }
      description="Lengkapi data sekolah, verifikasi kode OTP, lalu masuk ke akun ePAUD Anda."
    >
      <RegisterForm />
    </AuthShell>
  );
}
