import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { KontakForm } from "./kontak-form";

export const metadata: Metadata = {
  title: "Hubungi Kami — ePAUD",
  description: "Laporkan kendala Anda kepada tim ePAUD.",
};

export default function KontakPage() {
  return (
    <AuthShell
      heading={
        <>
          Butuh Bantuan?
          <br />
          Kami Siap Membantu
        </>
      }
      description="Laporkan kendala verifikasi, login, data, atau teknis. Kami akan menindaklanjuti melalui kontak Anda."
    >
      <KontakForm />
    </AuthShell>
  );
}
