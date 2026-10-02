import Image from "next/image";

/**
 * Logo brand panel. Bila sekolah mengunggah logo (`logo`) dan `nama` diisi,
 * logo & nama sekolah menggantikan brand ePAUD. Tanpa logo, kembali ke default.
 */
export function LogoLockup({
  compact = false,
  logo,
  nama,
}: {
  compact?: boolean;
  logo?: string | null;
  nama?: string;
}) {
  const sekolah = Boolean(logo && nama);
  const src = logo || "/epaud-logo.png";
  const alt = sekolah ? `Logo ${nama}` : "Logo ePAUD";

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Image
          src={src}
          alt={alt}
          width={1347}
          height={1167}
          priority
          unoptimized={Boolean(logo?.startsWith("data:"))}
          className="h-11 w-auto"
        />
        <div className="text-left">
          <p className="text-xl font-extrabold leading-none tracking-tight text-epaud-blue">
            {sekolah ? nama : "ePAUD"}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold leading-snug text-[#4a70ad]">
            Sistem Informasi PAUD
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 lg:justify-start">
      <Image
        src={src}
        alt={alt}
        width={1347}
        height={1167}
        priority
        unoptimized={Boolean(logo?.startsWith("data:"))}
        className="h-16 w-auto drop-shadow-sm sm:h-20 lg:h-[84px]"
      />
      <div className="text-left">
        <p className="text-[2rem] font-extrabold leading-none tracking-tight text-epaud-blue sm:text-[2.6rem]">
          {sekolah ? nama : "ePAUD"}
        </p>
        <p className="mt-1 text-[12px] font-semibold leading-snug text-[#4a70ad] sm:text-[13px]">
          Sistem Informasi
          <br />
          Pendidikan Anak Usia Dini
        </p>
      </div>
    </div>
  );
}