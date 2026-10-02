import { postJson } from "@/components/api";

type PresignResult = {
  upload_url: string;
  public_url: string;
  key: string;
  headers: Record<string, string>;
};

/**
 * Mengunggah gambar ke object storage lewat presigned PUT:
 * minta URL presign ke API, lalu PUT file langsung ke storage, dan
 * kembalikan URL publiknya (disimpan ke field foto/logo).
 */
export async function uploadImage(file: File, jenis: "foto" | "logo"): Promise<string> {
  const presign = await postJson<PresignResult>("/api/upload/presign", {
    jenis,
    content_type: file.type || "image/png",
    size: file.size,
  });
  if (!presign.ok) {
    throw new Error(presign.error.message);
  }

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    headers: presign.data.headers,
    body: file,
  });
  if (!put.ok) {
    throw new Error("Gagal mengunggah gambar ke storage.");
  }
  return presign.data.public_url;
}