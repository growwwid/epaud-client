import type { Metadata } from "next";
import { PersonDetail } from "@/components/person-detail";

export const metadata: Metadata = {
  title: "Detail Guru",
  description: "Profil guru.",
};

export default async function GuruDetailPage(props: PageProps<"/panel/guru/[id]">) {
  const { id } = await props.params;
  return <PersonDetail endpoint={`/api/guru/${id}`} title="Detail Guru" backHref="/panel/guru" />;
}