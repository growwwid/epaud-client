"use client";

import { AkunSekolahCrud } from "@/components/akun-sekolah-crud";
import { BuildingIcon } from "@/components/icons";

export default function AdminSekolahPage() {
  return (
    <AkunSekolahCrud
      variant="admin"
      icon={<BuildingIcon className="size-6" />}
      title="Admin Sekolah"
      subtitle="Kelola akun admin yang membantu operasional sekolah."
    />
  );
}
