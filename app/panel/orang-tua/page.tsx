"use client";

import { AkunSekolahCrud } from "@/components/akun-sekolah-crud";
import { UsersIcon } from "@/components/icons";

export default function OrangTuaPage() {
  return (
    <AkunSekolahCrud
      variant="orangtua"
      icon={<UsersIcon className="size-6" />}
      title="Orang Tua"
      subtitle="Kelola akun orang tua dan tautan ke anak (via NIK)."
    />
  );
}
