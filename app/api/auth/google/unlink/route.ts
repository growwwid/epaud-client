import { authedProxy } from "@/lib/epaud";

export async function POST() {
  return authedProxy("/api/v1/auth/google/unlink", { method: "POST" });
}
