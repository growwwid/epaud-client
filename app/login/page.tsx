import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/epaud";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk — ePAUD",
  description: "Masuk ke akun ePAUD Anda.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const jar = await cookies();
  if (jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE)) {
    redirect("/panel");
  }

  const searchParams = await props.searchParams;
  const registered = searchParams.registered === "1";
  const reset = searchParams.reset === "1";

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
      <LoginForm registered={registered} reset={reset} />
    </AuthShell>
  );
}
