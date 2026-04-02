import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const calSans = localFont({
  src: "./fonts/CalSans-Regular.ttf",
  variable: "--font-cal-sans",
});

export const metadata: Metadata = {
  title: "Zipline App",
  description: "shh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${calSans.variable}`}>
      <body className="font-sans antialiased bg-[#12121E] text-white">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
