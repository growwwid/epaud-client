"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJson, postJson, type MeResult } from "@/components/api";
import {
  buttonGhost,
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  Modal,
  Notice,
} from "@/components/crud-ui";
import {
  ChevronDownIcon,
  FileIcon,
  LogOutIcon,
  UserIcon,
} from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  kepala_sekolah: "Kepala Sekolah",
  admin_sekolah: "Admin Sekolah",
  guru: "Guru",
  orang_tua: "Orang Tua",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [me, setMe] = useState<MeResult | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    getJson<MeResult>("/api/auth/me").then((result) => {
      if (!active) return;
      if (result.ok) {
        setMe(result.data);
      } else if (result.status === 401) {
        router.replace("/login");
      }
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await postJson("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  const name = me?.nama || "Pengguna";
  const roleLabel = me ? ROLE_LABELS[me.role] ?? me.role : "Memuat...";
  const subtitle = me?.nama_sekolah ? `${roleLabel} · ${me.nama_sekolah}` : roleLabel;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Menu profil"
        className={`flex items-center gap-2 rounded-xl p-1.5 pr-2 transition ${
          open ? "bg-slate-100" : "hover:bg-slate-100"
        }`}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-epaud-blue text-sm font-bold text-white">
          {initials(name)}
        </span>
        <span className="hidden max-w-[12rem] text-left sm:block">
          <span className="block truncate text-sm font-semibold leading-tight text-slate-800">
            {name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-slate-500">
            {subtitle}
          </span>
        </span>
        <ChevronDownIcon
          className={`hidden size-4 text-slate-400 transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-900/10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UserIcon className="size-5 text-slate-400" />
            Profile
          </button>

          <div className="my-1.5 h-px bg-slate-100" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setReportOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileIcon className="size-5 text-slate-400" />
            Laporkan Kendala
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOutIcon className="size-5" />
            Logout
          </button>
        </div>
      ) : null}

      {reportOpen ? <ReportModal onClose={() => setReportOpen(false)} /> : null}
    </div>
  );
}

function ReportModal({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const kategori = String(data.get("kategori") ?? "").trim();
    const judul = String(data.get("judul") ?? "").trim();
    const deskripsi = String(data.get("deskripsi") ?? "").trim();

    if (!judul || !deskripsi) {
      setError("Judul dan deskripsi wajib diisi.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = await postJson("/api/tiket-kendala/saya", {
      kategori,
      judul,
      deskripsi,
    });
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setSent(true);
  }

  return (
    <Modal
      title="Laporkan Kendala"
      subtitle="Laporan dikirim ke tim superadmin ePAUD."
      onClose={onClose}
    >
      {sent ? (
        <div className="mt-5 space-y-4">
          <Notice>Laporan Anda telah terkirim. Terima kasih.</Notice>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={buttonPrimary}>
              Selesai
            </button>
          </div>
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="Kategori">
            <select name="kategori" defaultValue="teknis" className={inputClass}>
              <option value="verifikasi">Verifikasi / OTP</option>
              <option value="login">Tidak bisa login</option>
              <option value="data">Data sekolah/murid salah</option>
              <option value="teknis">Kendala teknis</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </Field>
          <Field label="Judul *">
            <input
              name="judul"
              className={inputClass}
              placeholder="Ringkasan kendala"
            />
          </Field>
          <Field label="Deskripsi *">
            <textarea
              name="deskripsi"
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-epaud-blue focus:ring-4 focus:ring-epaud-blue/10"
              placeholder="Jelaskan kendala yang Anda alami..."
            />
          </Field>

          {error ? <ErrorText>{error}</ErrorText> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={buttonGhost}>
              Batal
            </button>
            <button type="submit" disabled={submitting} className={buttonPrimary}>
              {submitting ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
