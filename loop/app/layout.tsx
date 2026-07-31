import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";


import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LOOP",
    template: "%s | LOOP",
  },
  description: "AI customer-feedback intelligence for evidence-backed product decisions.",
  applicationName: "LOOP",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#18152d",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
