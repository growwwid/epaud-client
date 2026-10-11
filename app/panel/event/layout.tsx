import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Event" };

export default function EventLayout({ children }: { children: ReactNode }) {
  return children;
}
