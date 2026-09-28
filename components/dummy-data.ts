import type { Event } from "./api";

// ponytail: data contoh. Ganti ke GET /api/event & GET /api/v1/dashboard/stats
// begitu backend event/dashboard tersedia. Tanggal relatif ke hari ini agar
// muncul di kalender.

function day(offset: number, hour = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function iso(d: Date) {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString();
}

export const DUMMY_EVENTS: Event[] = [
  {
    id: "evt-1",
    judul: "Rapat Guru Bulanan",
    deskripsi: "Evaluasi kegiatan belajar dan rencana bulan depan.",
    kategori: "rapat",
    lokasi: "Ruang Guru",
    tanggal_mulai: iso(day(0, 9)),
    all_day: false,
  },
  {
    id: "evt-2",
    judul: "Kegiatan Menanam Bersama",
    deskripsi: "Anak didik menanam tanaman di halaman sekolah.",
    kategori: "kegiatan",
    lokasi: "Halaman Sekolah",
    tanggal_mulai: iso(day(2, 8)),
    all_day: true,
  },
  {
    id: "evt-3",
    judul: "Pemeriksaan Kesehatan",
    deskripsi: "Posyandu berkunjung memeriksa kesehatan anak.",
    kategori: "kegiatan",
    lokasi: "Aula",
    tanggal_mulai: iso(day(5, 8)),
    all_day: true,
  },
  {
    id: "evt-4",
    judul: "Libur Nasional",
    deskripsi: "Sekolah libur.",
    kategori: "libur",
    tanggal_mulai: iso(day(12)),
    all_day: true,
  },
  {
    id: "evt-5",
    judul: "Pentas Seni Akhir Semester",
    deskripsi: "Penampilan anak didik bersama orang tua.",
    kategori: "kegiatan",
    lokasi: "Aula",
    tanggal_mulai: iso(day(20, 9)),
    all_day: false,
  },
  {
    id: "evt-6",
    judul: "Pengambilan Rapor",
    deskripsi: "Orang tua mengambil laporan perkembangan anak.",
    kategori: "kegiatan",
    lokasi: "Kelas masing-masing",
    tanggal_mulai: iso(day(-3, 8)),
    all_day: true,
  },
];
