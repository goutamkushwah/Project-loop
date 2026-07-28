import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: {
    default: "LOOP",
    template: "%s | LOOP"
  },
  description:
    "LOOP turns scattered customer feedback into ranked, evidence-backed product decisions.",
  applicationName: "LOOP"
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
