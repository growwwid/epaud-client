/**
 * Unduh data tabular sebagai CSV. Semua sel dikutip agar aman terhadap koma,
 * kutip, dan newline. Ditambahkan BOM supaya Excel membaca UTF-8 dengan benar.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const cell = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
