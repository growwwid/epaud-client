import type { Metadata } from "next";
import { PersonDetail } from "@/components/person-detail";

export const metadata: Metadata = {
  title: "Detail Murid",
  description: "Profil murid.",
};

export default async function MuridDetailPage(props: PageProps<"/panel/murid/[id]">) {
  const { id } = await props.params;
  return <PersonDetail endpoint={`/api/murid/${id}`} title="Detail Murid" backHref="/panel/murid" />;
}