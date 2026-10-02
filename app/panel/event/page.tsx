"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteJson,
  getJson,
  patchJson,
  postJson,
  type KalenderItem,
  type MeResult,
} from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Modal,
  PageHeader,
  Panel,
} from "@/components/crud-ui";
import { CalendarIcon, ClockIcon, MapPinIcon, PlusIcon } from "@/components/icons";
import { itemDateKey, tipeMeta } from "@/lib/kalender";

const MANAGE_ROLES = ["kepala_sekolah", "admin_sekolah"];

const tanggal = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const jam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function EventPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [items, setItems] = useState<KalenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<KalenderItem | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (res.ok) setRole(res.data.role);
      else if (res.status === 401) router.replace("/login");
    });
  }, [router]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const now = new Date();
      const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const end = new Date(now.getFullYear(), now.getMonth() + 4, 0);
      const to = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      const res = await getJson<KalenderItem[]>(`/api/kalender?from=${from}&to=${to}`);
      if (!active) return;
      if (res.ok) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const canManage = role ? MANAGE_ROLES.includes(role) : false;

  async function removeEvent(event: KalenderItem) {
    if (!window.confirm(`Hapus event "${event.judul}"?`)) return;
    setBusyId(event.id);
    const res = await deleteJson(`/api/event/${event.id}`);
    setBusyId(null);
    if (res.ok) setReloadKey((k) => k + 1);
  }

  const events = useMemo(
    () =>
      items
        .filter((it) => it.tipe !== "libur_nasional")
        .sort((a, b) => a.mulai.localeCompare(b.mulai)),
    [items],
  );

  const todayKey = `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon className="size-6" />}
        title="Event & Ulang Tahun"
        subtitle="Agenda kegiatan sekolah, event, dan ulang tahun anak."
      />

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
            Daftar Agenda
          </h2>
          {canManage ? (
            <button
              type="button"
              onClick={() => setFormTarget("new")}
              className="flex h-10 items-center gap-2 rounded-xl bg-epaud-blue px-4 text-sm font-bold text-white transition hover:bg-epaud-blue-dark"
            >
              <PlusIcon className="size-4" />
              Tambah Event
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Memuat…</p>
        ) : events.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
            Belum ada agenda.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.map((event) => {
              const meta = tipeMeta(event.tipe);
              const past = itemDateKey(event) < todayKey;
              return (
                <li
                  key={`${event.tipe}-${event.id}`}
                  className={`flex items-start gap-4 rounded-xl p-4 ${
                    past ? "bg-slate-50/50 opacity-70" : "bg-slate-50/70"
                  }`}
                >
                  <span className={`mt-1 size-2.5 shrink-0 rounded-full ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{event.judul}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                    {event.deskripsi ? (
                      <p className="mt-0.5 text-sm text-slate-500">{event.deskripsi}</p>
                    ) : null}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="size-3.5" />
                        {event.all_day
                          ? tanggal.format(new Date(`${itemDateKey(event)}T00:00:00`))
                          : `${tanggal.format(new Date(event.mulai))} · ${jam.format(new Date(event.mulai))}`}
                      </span>
                      {event.lokasi ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="size-3.5" />
                          {event.lokasi}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {canManage && event.tipe === "event_sekolah" ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormTarget(event)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvent(event)}
                        disabled={busyId === event.id}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {formTarget ? (
        <EventForm
          key={formTarget === "new" ? "new" : formTarget.id}
          item={formTarget === "new" ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}

function timeValue(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventForm({
  item,
  onClose,
  onSaved,
}: {
  item?: KalenderItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(item);
  const [allDay, setAllDay] = useState(item ? item.all_day : true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      kategori: String(data.get("kategori") ?? "").trim(),
      all_day: allDay,
      mulai,
      selesai: mulai,
      visibilitas: "default",
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
              defaultValue={item ? itemDateKey(item) : ""}
            />
          </Field>
          <Field label="Kategori">
            <select
              name="kategori"
              defaultValue={item?.kategori ?? "kegiatan"}
              className={inputClass}
            >
              <option value="kegiatan">Kegiatan</option>
              <option value="rapat">Rapat</option>
              <option value="libur">Libur</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
        </div>
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
            className={inputClass}
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