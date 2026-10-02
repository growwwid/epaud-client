import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/epaud";

/** Mengembalikan URL consent Google untuk login (endpoint API publik). */
export async function GET() {
  const res = await apiFetch("/api/v1/auth/google/login");
  const body = await res.text();
  return new NextResponse(body || null, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
