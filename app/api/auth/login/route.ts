import { NextResponse } from "next/server";
import { apiFetch, forward, setAuthCookies, type TokenPair } from "@/lib/epaud";

export async function POST(request: Request) {
  const body = await request.text();
  const remember = (() => {
    try {
      return JSON.parse(body)?.remember === true;
    } catch {
      return false;
    }
  })();

  const res = await apiFetch("/api/v1/auth/login", { method: "POST", body });
  if (!res.ok) return forward(res);

  const payload = (await res.json()) as { data: TokenPair };
  const out = NextResponse.json({
    data: {
      token_type: payload.data.token_type,
      expires_in: payload.data.expires_in,
    },
  });
  return setAuthCookies(out, payload.data, remember);
}
