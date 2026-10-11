"use client";

import { useState } from "react";
import { patchJson, postJson, type KalenderItem } from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Modal,
} from "@/components/crud-ui";
import {
  EVENT_COLORS,
  EVENT_COLOR_KEYS,
  isEventColor,
  itemDateKey,
  type EventColorKey,
} from "@/lib/kalender";

const PRESET_KATEGORI = ["kegiatan", "rapat", "libur"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeValue(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Form tambah/edit event sekolah. Dipakai halaman Event & Kalender. */
export function EventForm({
  item,
  initialDate = "",
  onClose,
  onSaved,
}: {
  item?: KalenderItem;
  initialDate?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(item);
  const [allDay, setAllDay] = useState(item ? item.all_day : true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialKategori = item?.kategori?.trim() || "kegiatan";
  const [kategori, setKategori] = useState(
    PRESET_KATEGORI.includes(initialKategori) ? initialKategori : "lainnya",
  );
  const [kategoriLain, setKategoriLain] = useState(
    PRESET_KATEGORI.includes(initialKategori) ? "" : initialKategori,
  );
  const [warna, setWarna] = useState<EventColorKey>(
    item?.warna && isEventColor(item.warna) ? item.warna : "blue",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const judul = String(data.get("judul") ?? "").trim();
    const date = String(data.get("tanggal") ?? "").trim();
    const time = String(data.get("jam") ?? "").trim() || "08:00";
    if (!judul || !date) {
      setError("Judul dan tanggal wajib diisi.");
      return;
    }
    const mulai = allDay ? date : new Date(`${date}T${time}`).toISOString();
    setError(null);
    setSubmitting(true);
    const body = {
      judul,
      deskripsi: String(data.get("deskripsi") ?? "").trim(),
      lokasi: String(data.get("lokasi") ?? "").trim(),
      kategori:
        kategori === "lainnya" ? kategoriLain.trim() || "lainnya" : kategori,
      all_day: allDay,
      mulai,
      selesai: mulai,
      visibilitas: "default",
      warna,
    };
    const res = item
      ? await patchJson(`/api/event/${item.id}`, body)
      : await postJson("/api/event", body);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={editing ? "Edit Event" : "Tambah Event"}
      subtitle="Event tampil di kalender sekolah."
      onClose={onClose}
    >
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <Field label="Judul *">
          <input
            name="judul"
            className={inputClass}
            placeholder="Rapat orang tua"
            defaultValue={item?.judul ?? ""}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal *">
            <input
              name="tanggal"
              type="date"
              className={inputClass}
              defaultValue={item ? itemDateKey(item) : initialDate}
            />
          </Field>
          <Field label="Kategori">
            <select
              name="kategori"
              value={kategori}
              onChange={(event) => setKategori(event.target.value)}
              className={inputClass}
            >
              <option value="kegiatan">Kegiatan</option>
              <option value="rapat">Rapat</option>
              <option value="libur">Libur</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
        </div>
        {kategori === "lainnya" ? (
          <Field label="Kategori Lainnya">
            <input
              value={kategoriLain}
              onChange={(event) => setKategoriLain(event.target.value)}
              className={inputClass}
              placeholder="Contoh: Pentas Seni"
            />
          </Field>
        ) : null}
        <Field label="Warna">
          <div className="flex flex-wrap gap-2">
            {EVENT_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setWarna(key)}
                aria-pressed={warna === key}
                aria-label={`Warna ${EVENT_COLORS[key].label}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  warna === key
                    ? EVENT_COLORS[key].selected
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className={`size-4 rounded-full ${EVENT_COLORS[key].dot}`} />
                {EVENT_COLORS[key].label}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(event) => setAllDay(event.target.checked)}
            className="size-4 rounded border-slate-300 accent-epaud-blue"
          />
          Sepanjang hari
        </label>
        {allDay ? null : (
          <Field label="Jam mulai">
            <input
              name="jam"
              type="time"
              className={inputClass}
              defaultValue={item && !item.all_day ? timeValue(item.mulai) : "08:00"}
            />
          </Field>
        )}
        <Field label="Lokasi">
          <input
            name="lokasi"
            className={inputClass}
            placeholder="Aula sekolah"
            defaultValue={item?.lokasi ?? ""}
          />
        </Field>
        <Field label="Deskripsi">
          <textarea
            name="deskripsi"
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
            defaultValue={item?.deskripsi ?? ""}
          />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={buttonGhost}>
            Batal
          </button>
          <button type="submit" disabled={submitting} className={buttonPrimary}>
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
