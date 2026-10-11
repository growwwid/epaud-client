"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getJson, patchJson, type MeResult } from "@/components/api";
import {
  buttonPrimary,
  ErrorText,
  Field,
  inputClass,
  PageHeader,
  Panel,
} from "@/components/crud-ui";
import { PasswordInput } from "@/components/password-input";
import { PhotoInput } from "@/components/photo-input";
import { GoogleIcon, UserIcon } from "@/components/icons";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  kepala_sekolah: "Kepala Sekolah",
  admin_sekolah: "Admin Sekolah",
  guru: "Guru",
  orang_tua: "Orang Tua",
};

export default function ProfilPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(() => {
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (res.ok) setMe(res.data);
      else if (res.status === 401) router.replace("/login");
      else setError(res.error.message);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("google");
    if (status === "linked") toast.success("Akun Google berhasil ditautkan.");
    else if (status === "error") toast.error("Gagal menautkan akun Google.");
    if (status) {
      window.history.replaceState({}, "", "/panel/profil");
      loadMe();
    }
  }, [loadMe]);

  async function linkGoogle() {
    setGoogleBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google/link");
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.data?.url) {
        setError(payload?.error?.message ?? "Google belum dikonfigurasi.");
        setGoogleBusy(false);
        return;
      }
      window.location.href = payload.data.url as string;
    } catch {
      setError("Tidak dapat menghubungi server. Coba lagi.");
      setGoogleBusy(false);
    }
  }

  async function unlinkGoogle() {
    if (!window.confirm("Lepas tautan akun Google?")) return;
    setGoogleBusy(true);
    const res = await fetch("/api/auth/google/unlink", { method: "POST" });
    setGoogleBusy(false);
    if (res.ok) {
      toast.success("Tautan akun Google dilepas.");
      loadMe();
    } else {
      toast.error("Gagal melepas tautan akun Google.");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!me) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const hasOrang = Boolean(me.orang_id);

    const body: Record<string, unknown> = { email, phone };
    if (hasOrang) {
      const nama = String(data.get("nama") ?? "").trim();
      if (!nama) {
        setError("Nama wajib diisi.");
        return;
      }
      body.nama = nama;
      body.foto = String(data.get("foto") ?? "");
    }
    if (password) body.password = password;

    setError(null);
    setSubmitting(true);
    const res = await patchJson<MeResult>("/api/auth/me", body);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setMe(res.data);
    toast.success("Profil berhasil diperbarui.");
    window.dispatchEvent(new Event("epaud:profil"));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<UserIcon className="size-6" />}
        title="Profil Saya"
        subtitle="Perbarui nama, kontak, dan kata sandi akun Anda."
      />

      <Panel>
        {loading || !me ? (
          <p className="text-sm text-slate-400">{error ? "" : "Memuat profil…"}</p>
        ) : (
          <form
            key={me.akun_id}
            className="max-w-xl space-y-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <p className="text-[13px] text-slate-500">
              {ROLE_LABEL[me.role] ?? me.role}
              {me.nama_sekolah ? ` · ${me.nama_sekolah}` : ""}
            </p>

            {me.orang_id ? (
              <>
                <Field label="Foto">
                  <PhotoInput name="foto" initial={me.foto ?? ""} shape="circle" />
                </Field>
                <Field label="Nama Lengkap *">
                  <input
                    name="nama"
                    className={inputClass}
                    defaultValue={me.nama}
                    placeholder="Nama lengkap"
                  />
                </Field>
              </>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  className={inputClass}
                  defaultValue={me.email}
                  placeholder="email@contoh.id"
                />
              </Field>
              <Field label="No. HP">
                <input
                  name="phone"
                  className={inputClass}
                  defaultValue={me.phone}
                  placeholder="08xxxxxxxxxx"
                />
              </Field>
            </div>

            <Field label="Kata Sandi Baru">
              <PasswordInput
                name="password"
                className={inputClass}
                placeholder="Kosongkan bila tidak diubah"
                hint="Minimal 8 karakter. Kosongkan bila tidak ingin mengubah."
                autoComplete="new-password"
              />
            </Field>

            {error ? <ErrorText>{error}</ErrorText> : null}

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={submitting} className={buttonPrimary}>
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </Panel>

      {!loading && me ? (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <GoogleIcon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Akun Google
                </p>
                <p className="text-[13px] text-slate-500">
                  {me.google_linked
                    ? "Tertaut. Anda bisa login dengan Google."
                    : "Belum tertaut. Tautkan agar bisa login tanpa password."}
                </p>
              </div>
            </div>
            {me.google_linked ? (
              <button
                type="button"
                onClick={unlinkGoogle}
                disabled={googleBusy}
                className="h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Lepas Tautan
              </button>
            ) : (
              <button
                type="button"
                onClick={linkGoogle}
                disabled={googleBusy}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {googleBusy ? "Mengalihkan…" : "Tautkan Google"}
              </button>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
