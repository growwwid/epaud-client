import { authedProxy } from "@/lib/epaud";

export async function GET() {
  return authedProxy("/api/v1/auth/google/link");
}
