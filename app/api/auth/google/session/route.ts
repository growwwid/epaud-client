import { NextResponse } from "next/server";
import { setAuthCookies, type TokenPair } from "@/lib/epaud";

/**
 * Menukar token hasil callback OAuth (diteruskan lewat URL fragment ke halaman
 * perantara) menjadi cookie sesi httpOnly. Fragment sengaja dipakai agar token
 * tidak ikut tercatat di log server/redirect.
 */
export async function POST(request: Request) {
  let tokens: Partial<TokenPair> = {};
  try {
    tokens = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid", message: "payload tidak valid" } },
      { status: 400 },
    );
  }

  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.json(
      { error: { code: "invalid", message: "token tidak lengkap" } },
      { status: 400 },
    );
  }

  const pair: TokenPair = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type ?? "Bearer",
    expires_in: tokens.expires_in ?? 900,
  };

  const out = NextResponse.json({ data: { token_type: pair.token_type } });
  return setAuthCookies(out, pair, true);
}
