import type { Metadata } from "next";
import { DetailTabungan } from "./detail-tabungan";

export const metadata: Metadata = {
  title: "Detail Tabungan — ePAUD",
  description: "Saldo dan riwayat transaksi tabungan anak.",
};

export default async function TabunganDetailPage(
  props: PageProps<"/panel/tabungan/[muridId]">,
) {
  const { muridId } = await props.params;
  const searchParams = await props.searchParams;
  const sekolah =
    typeof searchParams.sekolah === "string" ? searchParams.sekolah : undefined;

  return <DetailTabungan muridId={muridId} sekolahId={sekolah} />;
}
