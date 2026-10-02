"use client";

import { useEffect, useState } from "react";
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
import { UserIcon } from "@/components/icons";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<MeResult>("/api/auth/me").then((res) => {
      if (!active) return;
      if (res.ok) setMe(res.data);
      else if (res.status === 401) router.replace("/login");
      else setError(res.error.message);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

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
    </div>
  );
}
