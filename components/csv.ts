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

/**
 * Parser CSV minimal (RFC 4180): mendukung sel dikutip, koma/kutip ganda di
 * dalam kutipan, dan newline di dalam sel. BOM dibuang, baris kosong diabaikan.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Ubah tabel CSV jadi objek per baris dengan header (lowercase) sebagai kunci. */
export function csvRowsToObjects(table: string[][]): Record<string, string>[] {
  if (table.length < 2) return [];
  const headers = table[0].map((h) => h.trim().toLowerCase());
  return table.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      obj[header] = (cells[index] ?? "").trim();
    });
    return obj;
  });
}

/** Pisahkan sel berisi beberapa NIK (dipisah `;` atau `|`). */
export function splitList(value: string): string[] {
  return value
    .split(/[;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}
