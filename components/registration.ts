export type PendingRegistration = {
  schoolId: string;
  kanal: string;
  tujuan: string;
  expiresIn: number;
};

export const PENDING_REGISTRATION_KEY = "epaud:pending-registration";

export function savePendingRegistration(data: PendingRegistration) {
  try {
    window.sessionStorage.setItem(
      PENDING_REGISTRATION_KEY,
      JSON.stringify(data),
    );
  } catch {
    // abaikan bila storage tidak tersedia
  }
}

export function clearPendingRegistration() {
  try {
    window.sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
  } catch {
    // abaikan bila storage tidak tersedia
  }
}

/** Samarkan email/nomor telepon untuk ditampilkan di halaman OTP. */
export function maskContact(contact: string): string {
  const value = contact.trim();

  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
    return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return value;
  return `${digits.slice(0, 4)}${"*".repeat(digits.length - 6)}${digits.slice(-2)}`;
}
