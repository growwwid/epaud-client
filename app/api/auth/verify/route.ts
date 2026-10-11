import { apiFetch, forward } from "@/lib/epaud";

export async function POST(request: Request) {
  const body = await request.text();
  const res = await apiFetch("/api/v1/auth/verifikasi", {
    method: "POST",
    body,
  });
  return forward(res);
}
