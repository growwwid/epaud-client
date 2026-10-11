import type { KalenderItem } from "@/components/api";

export const TIPE_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  ulang_tahun: {
    label: "Ulang Tahun",
    badge: "bg-pink-50 text-pink-600",
    dot: "bg-pink-500",
  },
  event_sekolah: {
    label: "Event Sekolah",
    badge: "bg-epaud-sky text-epaud-blue",
    dot: "bg-epaud-blue",
  },
  event_global: {
    label: "Event",
    badge: "bg-violet-50 text-violet-600",
    dot: "bg-violet-500",
  },
  libur_nasional: {
    label: "Libur Nasional",
    badge: "bg-rose-50 text-rose-500",
    dot: "bg-rose-500",
  },
};

export function tipeMeta(tipe: string) {
  return TIPE_META[tipe] ?? TIPE_META.event_sekolah;
}

/** Pilihan warna event (dibatasi 5, selaras validasi API). */
export const EVENT_COLOR_KEYS = ["blue", "green", "amber", "rose", "violet"] as const;
export type EventColorKey = (typeof EVENT_COLOR_KEYS)[number];

export const EVENT_COLORS: Record<
  EventColorKey,
  { label: string; dot: string; badge: string; selected: string }
> = {
  blue: {
    label: "Biru",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600",
    selected: "border-blue-500 bg-blue-50 text-blue-600",
  },
  green: {
    label: "Hijau",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
    selected: "border-emerald-500 bg-emerald-50 text-emerald-600",
  },
  amber: {
    label: "Kuning",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-600",
    selected: "border-amber-500 bg-amber-50 text-amber-600",
  },
  rose: {
    label: "Merah",
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-600",
    selected: "border-rose-500 bg-rose-50 text-rose-600",
  },
  violet: {
    label: "Ungu",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-600",
    selected: "border-violet-500 bg-violet-50 text-violet-600",
  },
};

export function isEventColor(value: string): value is EventColorKey {
  return (EVENT_COLOR_KEYS as readonly string[]).includes(value);
}

/** Warna pilihan event; null untuk item non-event (ulang tahun/libur). */
export function itemColor(item: KalenderItem) {
  if (item.tipe !== "event_sekolah" && item.tipe !== "event_global") return null;
  const key = (item.warna ?? "").toLowerCase();
  return EVENT_COLORS[isEventColor(key) ? key : "blue"];
}

/**
 * Meta visual item: label mengikuti tipe, warna dot/badge mengikuti warna event
 * bila ada (ulang tahun/libur nasional tetap memakai warna tipe).
 */
export function itemVisual(item: KalenderItem) {
  const tipe = tipeMeta(item.tipe);
  const color = itemColor(item);
  return color ? { ...tipe, dot: color.dot, badge: color.badge } : tipe;
}

export function kategoriLabel(kategori?: string): string {
  const value = (kategori ?? "").trim();
  if (!value) return "Tanpa Kategori";
  if (value === "ulang_tahun") return "Ulang Tahun";
  if (value === "libur") return "Libur";
  if (value === "kegiatan") return "Kegiatan";
  if (value === "rapat") return "Rapat";
  if (value === "lainnya") return "Lainnya";
  return value;
}

const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Tanggal (YYYY-MM-DD) sebuah item pada zona waktu event. Penting: jangan
 * memakai slice() dari RFC3339 karena event tengah malam WIB tersimpan
 * sebagai 17:00Z hari sebelumnya (pilih 14 tampil 13).
 */
export function itemDateKey(item: KalenderItem): string {
  const timeZone = item.zona_waktu || "UTC";
  let formatter = dateKeyFormatters.get(timeZone);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return item.mulai.slice(0, 10);
    }
    dateKeyFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(item.mulai));
}

export function itemsByDay(items: KalenderItem[]): Map<string, KalenderItem[]> {
  const map = new Map<string, KalenderItem[]>();
  for (const item of items) {
    const key = itemDateKey(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}