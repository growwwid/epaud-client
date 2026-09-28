"use client";

import { useState } from "react";
import { toast } from "sonner";

const MAX_FOTO_BYTES = 1_200_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Input foto profil (uncontrolled via hidden input `name`). Nilai berupa data
 * URL base64; kosong berarti tanpa foto.
 */
export function PhotoInput({
  name,
  initial = "",
  hint = "Kosong = tanpa foto. Maks ~1 MB.",
  shape = "square",
}: {
  name: string;
  initial?: string;
  hint?: string;
  shape?: "square" | "circle";
}) {
  const [foto, setFoto] = useState(initial);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FOTO_BYTES) {
      toast.error("Ukuran foto terlalu besar (maks ~1 MB).");
      return;
    }
    setFoto(await readAsDataUrl(file));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <span
          className={`flex size-16 shrink-0 items-center justify-center overflow-hidden border border-slate-100 bg-slate-50 ${
            shape === "circle" ? "rounded-full" : "rounded-2xl"
          }`}
        >
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt="Foto" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">Tanpa foto</span>
          )}
        </span>
        <div className="space-y-1">
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            className="block text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-epaud-sky file:px-4 file:py-2 file:text-sm file:font-semibold file:text-epaud-blue"
          />
          {foto ? (
            <button
              type="button"
              onClick={() => setFoto("")}
              className="text-xs font-semibold text-rose-500 hover:underline"
            >
              Hapus foto
            </button>
          ) : (
            <p className="text-xs text-slate-400">{hint}</p>
          )}
        </div>
      </div>
      <input type="hidden" name={name} value={foto} />
    </div>
  );
}