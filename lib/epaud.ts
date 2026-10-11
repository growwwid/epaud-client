import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "epaud_access";
export const REFRESH_COOKIE = "epaud_refresh";

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export function apiBaseUrl() {
  return (process.env.EPAUD_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    "",
  );
}

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
    cache: "no-store",
  });
}

export function bearer(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export function setAuthCookies(
  res: NextResponse,
  tokens: TokenPair,
  persistent = true,
) {
  res.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...COOKIE_OPTS,
    maxAge: tokens.expires_in || ACCESS_MAX_AGE,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...COOKIE_OPTS,
    ...(persistent ? { maxAge: REFRESH_MAX_AGE } : {}),
  });
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}

/** Teruskan response API apa adanya agar bentuk error tetap konsisten. */
export async function forward(res: Response) {
  const body = await res.text();
  return new NextResponse(body || null, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Refresh token dirotasi oleh backend: sekali dipakai, token lama dihapus.
 * Karena satu halaman panel memicu beberapa request paralel, request yang
 * sama-sama kena 401 harus berbagi SATU kali refresh. Tanpa ini, refresh
 * kedua memakai token lama yang sudah dihapus → 401 → cookie dibersihkan →
 * user ter-logout tak sengaja.
 */
const REFRESH_GRACE_MS = 10_000;

type RefreshOutcome =
  | { status: "ok"; tokens: TokenPair }
  | { status: "invalid" }
  | { status: "unavailable" };

const inflightRefreshes = new Map<string, Promise<RefreshOutcome>>();
const recentRefreshes = new Map<string, { tokens: TokenPair; at: number }>();

function pruneRecentRefreshes() {
  const now = Date.now();
  for (const [key, entry] of recentRefreshes) {
    if (now - entry.at > REFRESH_GRACE_MS) recentRefreshes.delete(key);
  }
}

function refreshTokens(refresh: string): Promise<RefreshOutcome> {
  const recent = recentRefreshes.get(refresh);
  if (recent && Date.now() - recent.at < REFRESH_GRACE_MS) {
    return Promise.resolve({ status: "ok", tokens: recent.tokens });
  }

  const existing = inflightRefreshes.get(refresh);
  if (existing) return existing;

  const promise = (async (): Promise<RefreshOutcome> => {
    try {
      const res = await apiFetch("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (res.ok) {
        const payload = (await res.json()) as { data: TokenPair };
        recentRefreshes.set(refresh, { tokens: payload.data, at: Date.now() });
        pruneRecentRefreshes();
        return { status: "ok", tokens: payload.data };
      }
      // Refresh ditolak eksplisit = token memang tidak berlaku lagi.
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return { status: "invalid" };
      }
      // 5xx / status tak terduga: gangguan sementara, jangan bunuh sesi.
      return { status: "unavailable" };
    } catch {
      // API tidak terjangkau (mis. deploy/restart): gangguan sementara.
      return { status: "unavailable" };
    } finally {
      inflightRefreshes.delete(refresh);
    }
  })();

  inflightRefreshes.set(refresh, promise);
  return promise;
}

function serviceUnavailable() {
  return NextResponse.json(
    {
      error: {
        code: "service_unavailable",
        message: "server sementara tidak tersedia, coba lagi sebentar lagi",
      },
    },
    { status: 503 },
  );
}

/**
 * Panggil API dengan Bearer token dari cookie. Bila access token kedaluwarsa,
 * tukar pakai refresh token (rotasi, single-flight) lalu ulangi sekali.
 * Response diteruskan apa adanya; cookie auth diperbarui saat token dirotasi.
 *
 * Kegagalan sementara (API restart/deploy, 5xx) TIDAK menghapus cookie agar
 * user tidak ter-logout; cookie hanya dibersihkan bila refresh ditolak (4xx).
 */
export async function authedProxy(path: string, init: RequestInit = {}) {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  const call = (token?: string) =>
    apiFetch(path, {
      ...init,
      headers: {
        ...((init.headers as Record<string, string>) ?? {}),
        ...bearer(token),
      },
    });

  if (access) {
    let res: Response;
    try {
      res = await call(access);
    } catch {
      return serviceUnavailable();
    }
    if (res.status !== 401) return forward(res);
    if (!refresh) return clearAuthCookies(await forward(res));
  } else if (!refresh) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "belum masuk" } },
      { status: 401 },
    );
  }

  const outcome = await refreshTokens(refresh);
  if (outcome.status === "invalid") {
    return clearAuthCookies(
      NextResponse.json(
        { error: { code: "unauthorized", message: "sesi berakhir" } },
        { status: 401 },
      ),
    );
  }
  if (outcome.status === "unavailable") {
    return serviceUnavailable();
  }

  let res: Response;
  try {
    res = await call(outcome.tokens.access_token);
  } catch {
    // Token baru sudah didapat; simpan supaya rotasi tidak hilang percuma.
    return setAuthCookies(serviceUnavailable(), outcome.tokens);
  }
  return setAuthCookies(await forward(res), outcome.tokens);
}
