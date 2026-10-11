import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  apiFetch,
  bearer,
  clearAuthCookies,
} from "@/lib/epaud";

export async function POST() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (access) {
    await apiFetch("/api/v1/auth/logout", {
      method: "POST",
      headers: bearer(access),
      body: JSON.stringify(refresh ? { refresh_token: refresh } : {}),
    }).catch(() => {});
  }

  return clearAuthCookies(NextResponse.json({ data: { status: "ok" } }));
}
