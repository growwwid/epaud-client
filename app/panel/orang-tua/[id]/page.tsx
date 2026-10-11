import type { Metadata } from "next";
import { PersonDetail } from "@/components/person-detail";

export const metadata: Metadata = {
  title: "Detail Orang Tua",
  description: "Profil orang tua/wali.",
};

export default async function OrangTuaDetailPage(
  props: PageProps<"/panel/orang-tua/[id]">,
) {
  const { id } = await props.params;
  return (
    <PersonDetail
      endpoint={`/api/orang-tua/${id}`}
      title="Detail Orang Tua"
      backHref="/panel/orang-tua"
    />
  );
}