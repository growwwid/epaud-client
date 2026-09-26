import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk — ePAUD",
  description: "Masuk ke akun ePAUD Anda.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const registered = searchParams.registered === "1";

  return (
    <AuthShell
      heading={
        <>
          Bersama Membangun
          <br />
          Masa Depan Anak
        </>
      }
      description="Kelola data, pantau perkembangan, dan wujudkan pendidikan PAUD yang lebih baik."
    >
      <LoginForm registered={registered} />
    </AuthShell>
  );
}
