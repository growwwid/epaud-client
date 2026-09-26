import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { OtpForm } from "./otp-form";

export const metadata: Metadata = {
  title: "Verifikasi OTP — ePAUD",
  description: "Masukkan kode OTP untuk memverifikasi pendaftaran ePAUD.",
};

export default function VerifyOtpPage() {
  return (
    <AuthShell
      heading={
        <>
          Verifikasi
          <br />
          Kode OTP
        </>
      }
      description="Kami telah mengirim kode verifikasi 4 digit ke email atau WhatsApp Anda."
    >
      <OtpForm />
    </AuthShell>
  );
}
