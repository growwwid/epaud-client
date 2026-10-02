import { authedProxy } from "@/lib/epaud";

export async function GET() {
  return authedProxy("/api/v1/auth/me");
}

export async function PATCH(request: Request) {
  const body = await request.text();
  return authedProxy("/api/v1/auth/me", { method: "PATCH", body });
}
