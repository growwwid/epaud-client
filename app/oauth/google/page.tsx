"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Halaman perantara callback OAuth. Token diterima lewat URL fragment (agar
 * tidak masuk log server), lalu ditukar menjadi cookie sesi httpOnly.
 */
export default function GoogleOAuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function exchange() {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        setError("Token login Google tidak lengkap.");
        return;
      }
      try {
        const res = await fetch("/api/auth/google/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: Number(params.get("expires_in") ?? 900),
          }),
        });
        if (!res.ok) throw new Error();
        if (active) {
          router.replace("/panel");
          router.refresh();
        }
      } catch {
        if (active) setError("Gagal menyelesaikan login Google.");
      }
    }

    exchange();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <p className="text-sm text-slate-500">
        {error ?? "Menyelesaikan login Google…"}
      </p>
    </div>
  );
}
