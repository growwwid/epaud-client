import { test } from "node:test";
import assert from "node:assert/strict";
import { itemDateKey } from "./kalender.ts";

test("itemDateKey: pakai zona waktu event (bukan slice UTC)", () => {
  // tengah malam WIB tersimpan sebagai 17:00Z hari sebelumnya
  assert.equal(
    itemDateKey({
      tipe: "event_sekolah",
      id: "e1",
      judul: "Rapat",
      mulai: "2026-10-13T17:00:00Z",
      all_day: true,
      zona_waktu: "Asia/Jakarta",
    }),
    "2026-10-14",
  );

  assert.equal(
    itemDateKey({
      tipe: "event_global",
      id: "e2",
      judul: "Event",
      mulai: "2026-10-14T00:00:00Z",
      all_day: true,
      zona_waktu: "UTC",
    }),
    "2026-10-14",
  );

  // zona waktu kosong → fallback UTC
  assert.equal(
    itemDateKey({
      tipe: "event_global",
      id: "e3",
      judul: "Event",
      mulai: "2026-10-14T05:00:00Z",
      all_day: true,
    }),
    "2026-10-14",
  );
});
