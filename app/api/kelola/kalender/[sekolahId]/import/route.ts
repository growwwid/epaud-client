import { authedProxy } from "@/lib/epaud";

type Ctx = { params: Promise<{ sekolahId: string }> };

/**
 * Teruskan unggahan multipart (.ics) apa adanya. Catch-all `[...path]` tidak
 * dipakai karena memaksa Content-Type JSON dan membaca body sebagai teks.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { sekolahId } = await params;
  const mode = new URL(request.url).searchParams.get("mode") ?? "merge";
  const body = await request.arrayBuffer();
  return authedProxy(`/api/v1/kelola/kalender/${sekolahId}/import?mode=${mode}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/octet-stream",
    },
  });
}
