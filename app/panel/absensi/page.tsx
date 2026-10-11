"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getJson,
  postJson,
  putJson,
  type Absensi,
  type AbsensiLokasi,
  type AbsensiRekap,
  type MeResult,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  EmptyRow,
  ErrorText,
  Field,
  inputClass,
  PageHeader,
  Panel,
  tableHeadClass,
} from "@/components/crud-ui";
import { CalendarIcon, MapPinIcon } from "@/components/icons";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function monthRange() {
  const now = new Date();
  const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const to = `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
  return { from, to };
}

const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function AbsensiPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResult | null>(null);

  useEffect(() => {
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (!res.ok) {
        if (res.status === 401) router.replace("/login");
        return;
      }
      setMe(res.data);
    });
  }, [router]);

  if (!me) {
    return <p className="text-sm text-slate-400">Memuat…</p>;
  }

  const isManage = MANAGE_ROLES.includes(me.role);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<MapPinIcon className="size-6" />}
        title="Absensi Guru"
        subtitle={
          isManage
            ? "Atur lokasi sekolah dan pantau rekap kehadiran guru."
            : "Absen kehadiran Anda dengan verifikasi lokasi."
        }
      />
      {me.role === "guru" ? <GuruView /> : null}
      {isManage ? <ManageView /> : null}
    </div>
  );
}

function GuruView() {
  const [today, setToday] = useState<Absensi | null>(null);
  const [history, setHistory] = useState<Absensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const { from, to } = monthRange();
    Promise.all([
      getJson<Absensi | null>("/api/absensi-guru/saya/hari-ini"),
      getJson<Absensi[]>(`/api/absensi-guru/saya?from=${from}&to=${to}`),
    ]).then(([todayRes, historyRes]) => {
      if (todayRes.ok) setToday(todayRes.data ?? null);
      if (historyRes.ok) setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function checkIn() {
    if (!navigator.geolocation) {
      setError("Perangkat tidak mendukung geolokasi.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const res = await postJson<Absensi>("/api/absensi-guru/check-in", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          device_info: navigator.userAgent,
          is_mock_location: false,
        });
        setLocating(false);
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        toast.success("Absensi berhasil dicatat.");
        load();
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan lalu coba lagi."
            : "Gagal membaca lokasi. Coba lagi.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Absensi hari ini</p>
            {today ? (
              <p className="mt-1 text-sm text-slate-500">
                Hadir pukul {today.jam_masuk ? jam.format(new Date(today.jam_masuk)) : "—"}
                {today.distance_meter != null
                  ? ` · jarak ${Math.round(today.distance_meter)} m`
                  : ""}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Belum absen hari ini.</p>
            )}
          </div>
          <button
            type="button"
            onClick={checkIn}
            disabled={locating || Boolean(today)}
            className={buttonPrimary}
          >
            <span className="inline-flex items-center gap-2">
              <MapPinIcon className="size-4" />
              {today ? "Sudah Absen" : locating ? "Mendeteksi lokasi…" : "Absen Sekarang"}
            </span>
          </button>
        </div>
        {error ? (
          <div className="mt-4">
            <ErrorText>{error}</ErrorText>
          </div>
        ) : null}
      </Panel>

      <Panel>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Riwayat Bulan Ini
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Jam Masuk</th>
                <th className="px-4 py-2">Jarak</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyRow colSpan={4} label="Memuat…" />
              ) : history.length === 0 ? (
                <EmptyRow colSpan={4} label="Belum ada riwayat." />
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="rounded-xl bg-slate-50/60 text-sm text-slate-700">
                    <td className="rounded-l-xl px-4 py-3">{item.tanggal}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.jam_masuk ? jam.format(new Date(item.jam_masuk)) : "—"}
                    </td>
                    <td className="rounded-r-xl px-4 py-3 text-slate-500">
                      {item.distance_meter != null
                        ? `${Math.round(item.distance_meter)} m`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function ManageView() {
  const [lokasi, setLokasi] = useState<AbsensiLokasi | null>(null);
  const [rekap, setRekap] = useState<AbsensiRekap[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { from, to } = useMemo(() => monthRange(), []);

  const load = useCallback(() => {
    getJson<AbsensiLokasi>("/api/absensi-guru/lokasi").then((res) => {
      if (res.ok) setLokasi(res.data);
      else setError(res.error.message);
    });
    getJson<AbsensiRekap[]>(`/api/absensi-guru/rekap?from=${from}&to=${to}`).then((res) => {
      if (res.ok) setRekap(Array.isArray(res.data) ? res.data : []);
    });
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLokasi((prev) =>
          prev
            ? {
                ...prev,
                latitude: Number(position.coords.latitude.toFixed(6)),
                longitude: Number(position.coords.longitude.toFixed(6)),
              }
            : prev,
        );
      },
      () => setError("Gagal membaca lokasi perangkat."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    const res = await putJson<AbsensiLokasi>("/api/absensi-guru/lokasi", {
      latitude: Number(data.get("latitude") ?? 0),
      longitude: Number(data.get("longitude") ?? 0),
      radius_meter: Number(data.get("radius_meter") ?? 20),
      accuracy_tolerance_meter: Number(data.get("accuracy_tolerance_meter") ?? 50),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setLokasi(res.data);
    toast.success("Lokasi sekolah disimpan.");
  }

  if (!lokasi) {
    return <Panel>{error ? <ErrorText>{error}</ErrorText> : <p className="text-sm text-slate-400">Memuat…</p>}</Panel>;
  }

  return (
    <>
      <Panel>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
          Lokasi Sekolah (Geofence)
        </h2>
        <form className="mt-3 max-w-2xl space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude *">
              <input
                name="latitude"
                type="number"
                step="any"
                className={inputClass}
                defaultValue={lokasi.latitude}
              />
            </Field>
            <Field label="Longitude *">
              <input
                name="longitude"
                type="number"
                step="any"
                className={inputClass}
                defaultValue={lokasi.longitude}
              />
            </Field>
            <Field label="Radius (meter) *">
              <input
                name="radius_meter"
                type="number"
                className={inputClass}
                defaultValue={lokasi.radius_meter}
              />
            </Field>
            <Field label="Toleransi Akurasi (meter)">
              <input
                name="accuracy_tolerance_meter"
                type="number"
                className={inputClass}
                defaultValue={lokasi.accuracy_tolerance_meter}
              />
            </Field>
          </div>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={useMyLocation} className={buttonGhost}>
              Pakai Lokasi Saya
            </button>
            <button type="submit" disabled={saving} className={buttonPrimary}>
              {saving ? "Menyimpan…" : "Simpan Lokasi"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-slate-400" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Rekap Bulan Ini
          </h2>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className={tableHeadClass}>
                <th className="px-4 py-2">Guru</th>
                <th className="px-4 py-2">Hadir</th>
                <th className="px-4 py-2">Izin</th>
                <th className="px-4 py-2">Sakit</th>
                <th className="px-4 py-2">Alpa</th>
              </tr>
            </thead>
            <tbody>
              {rekap.length === 0 ? (
                <EmptyRow colSpan={5} label="Belum ada data absensi." />
              ) : (
                rekap.map((item) => (
                  <tr key={item.guru_id} className="rounded-xl bg-slate-50/60 text-sm text-slate-700">
                    <td className="rounded-l-xl px-4 py-3 font-semibold text-slate-800">
                      {item.nama}
                    </td>
                    <td className="px-4 py-3 text-emerald-600">{item.hadir}</td>
                    <td className="px-4 py-3 text-amber-600">{item.izin}</td>
                    <td className="px-4 py-3 text-sky-600">{item.sakit}</td>
                    <td className="rounded-r-xl px-4 py-3 text-rose-600">{item.alpa}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
