export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
};

export type MeResult = {
  akun_id: string;
  orang_id: string;
  nama: string;
  email: string;
  phone: string;
  email_verified: boolean;
  phone_verified: boolean;
  sekolah_id: string;
  nama_sekolah: string;
  role: string;
  must_change_password: boolean;
};

export type Guru = {
  id: string;
  orang_id?: string;
  nama: string;
  nip?: string;
  jenis: "guru_kelas" | "guru_pendamping" | string;
  phone?: string;
  email?: string;
  is_active: boolean;
};

export type Murid = {
  id: string;
  orang_id?: string;
  nama: string;
  nisn?: string;
  tanggal_lahir?: string | null;
  jenis_kelamin?: string;
  status: string;
};

export type TahunAjaran = {
  id: string;
  nama: string;
  semester: "ganjil" | "genap" | string;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  is_active: boolean;
};

export type Kelas = {
  id: string;
  tahun_ajaran_id: string;
  nama: string;
  tingkat?: string;
};

export type AkunSekolah = {
  akun_id: string;
  orang_id: string;
  nama: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  must_change_password: boolean;
};

export type GuruAssignment = {
  guru_id: string;
  nama?: string;
  peran: string;
};

export type AkunResult = {
  akun_id: string;
  orang_id: string;
  nama: string;
  email?: string;
  phone?: string;
  password_default?: boolean;
};

/** Referensi orang (NIK). Backend mengembalikan field tanpa tag json. */
export type OrangRef = {
  id?: string;
  ID?: string;
  nik?: string;
  NIK?: string;
  nama?: string;
  Nama?: string;
};

export type EventKategori =
  | "kegiatan"
  | "libur"
  | "rapat"
  | "lainnya"
  | string;

/**
 * Event sekolah. Unik per sekolah (tenant-scoped). Backend belum tersedia;
 * kontrak usulan: GET/POST /api/v1/event, PATCH/DELETE /api/v1/event/{id}.
 */
export type Event = {
  id: string;
  judul: string;
  deskripsi?: string;
  kategori?: EventKategori;
  lokasi?: string;
  tanggal_mulai: string;
  tanggal_selesai?: string | null;
  all_day?: boolean;
  created_by?: string;
  created_at?: string;
};

/** Kontrak usulan GET /api/v1/dashboard/stats. */
export type DashboardStats = {
  jumlah_guru: number;
  jumlah_murid: number;
  total_saldo: number;
  jumlah_murid_diajar?: number;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError };

export type Transaksi = {
  id: string;
  murid_id: string;
  tipe: "setor" | "tarik" | "penyesuaian" | string;
  nominal: number;
  saldo_setelah: number;
  tanggal: string;
  catatan?: string;
  created_at?: string;
};

export type SaldoMurid = {
  murid_id: string;
  nama: string;
  ortu_nama?: string;
  nisn?: string;
  kelas?: string;
  status?: string;
  saldo: number;
  transaksi_terakhir?: Transaksi | null;
};

export type AnakTabungan = SaldoMurid & {
  sekolah_id: string;
  sekolah_nama: string;
};

/** Agregat tabungan untuk kartu statistik. setor = kredit, tarik = debit. */
export type RingkasanTabungan = {
  total_saldo: number;
  total_setor: number;
  total_tarik: number;
};

export type ListMeta = { page: number; size: number; total: number };

export type SekolahProfil = {
  id: string;
  nama: string;
  npsn: string;
  tipe: string;
  alamat: string;
  logo?: string;
};

export type TabunganRekap = {
  data: SaldoMurid[];
  meta: ListMeta;
  total_saldo: number;
};

export type TransaksiList = { data: Transaksi[]; meta: ListMeta };

export type Tiket = {
  id: string;
  akun_id?: string;
  sekolah_id?: string;
  nama: string;
  email?: string;
  phone?: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  status: "baru" | "diproses" | "selesai" | string;
  sumber: "publik" | "akun" | string;
  created_at?: string;
  updated_at?: string;
};

export type TiketList = { data: Tiket[]; meta: ListMeta };

const NETWORK_ERROR: ApiError = {
  code: "network",
  message: "Tidak dapat menghubungi server. Coba lagi.",
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  raw = false,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: payload?.error ?? {
          code: "unknown",
          message: "Terjadi kesalahan. Coba lagi.",
        },
      };
    }
    return { ok: true, data: (raw ? payload : payload?.data ?? payload) as T };
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
}

export function postJson<T>(path: string, body?: unknown) {
  return request<T>("POST", path, body);
}

export function putJson<T>(path: string, body?: unknown) {
  return request<T>("PUT", path, body);
}

export function patchJson<T>(path: string, body?: unknown) {
  return request<T>("PATCH", path, body);
}

export function deleteJson<T>(path: string) {
  return request<T>("DELETE", path);
}

export function getJson<T>(path: string) {
  return request<T>("GET", path);
}

/** Seperti getJson, tapi mengembalikan envelope utuh (`data`, `meta`, ...). */
export function getEnvelope<T>(path: string) {
  return request<T>("GET", path, undefined, true);
}
