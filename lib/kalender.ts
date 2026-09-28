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

/** Tanggal (YYYY-MM-DD) sebuah item; all-day memakai bagian tanggal RFC3339. */
export function itemDateKey(item: KalenderItem): string {
  return item.mulai.slice(0, 10);
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