import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, csvRowsToObjects, splitList } from "./csv.ts";

test("parseCsv: kutipan, koma, newline, BOM", () => {
  const input =
    '\uFEFFnama,catatan\r\n"Doe, John","baris1\nbaris2"\r\n"says ""hi""",ok\r\n';
  assert.deepEqual(parseCsv(input), [
    ["nama", "catatan"],
    ["Doe, John", "baris1\nbaris2"],
    ['says "hi"', "ok"],
  ]);
});

test("csvRowsToObjects: header lowercase, baris kosong dibuang", () => {
  assert.deepEqual(csvRowsToObjects(parseCsv("Nama,Jenis\nBudi,guru_kelas\n\n")), [
    { nama: "Budi", jenis: "guru_kelas" },
  ]);
});

test("splitList: pisah ; dan |", () => {
  assert.deepEqual(splitList("a; b|c"), ["a", "b", "c"]);
  assert.deepEqual(splitList(""), []);
});
