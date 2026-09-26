import Image from "next/image";
import type { ReactNode } from "react";
import { LogoLockup } from "./logo-lockup";

export function AuthShell({
  heading,
  description,
  children,
}: {
  heading: ReactNode;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen w-full flex-1 flex-col bg-epaud-sky font-epaud lg:block">
      {/* Illustration: a top banner on mobile, full-bleed background on desktop */}
      <div
        aria-hidden="true"
        className="relative h-[30vh] min-h-[220px] w-full overflow-hidden rounded-b-[2.5rem] lg:absolute lg:inset-0 lg:h-full lg:rounded-none"
      >
        <Image
          src="/bg-login.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-epaud-sky lg:hidden" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-10 pt-8 sm:px-8 lg:min-h-screen lg:max-w-none lg:flex-row lg:items-center lg:gap-10 lg:px-12 lg:py-14 xl:gap-16 xl:px-20">
        <section className="flex flex-col items-center text-center lg:w-[52%] lg:self-start lg:pt-6 xl:pt-10">
          <LogoLockup />
          <h1 className="mt-7 text-[1.6rem] font-extrabold leading-tight tracking-tight text-[#1c4d8c] sm:text-3xl lg:mt-10 lg:text-[2.35rem] xl:text-[2.75rem]">
            {heading}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5b6f8f] sm:text-base lg:mt-5 lg:max-w-sm">
            {description}
          </p>
        </section>

        <section className="mt-9 flex w-full justify-center lg:mt-0 lg:w-[48%] lg:self-center">
          {children}
        </section>
      </div>
    </main>
  );
}
