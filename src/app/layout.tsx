import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TrackerProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "HappyBelly AI — effortless calorie & macro tracking",
  description:
    "Log meals in plain English or from a photo. HappyBelly AI estimates calories, protein, carbs and fats, adapts your TDEE, and keeps your streak alive.",
  applicationName: "HappyBelly AI",
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <TrackerProvider>{children}</TrackerProvider>
      </body>
    </html>
  );
}
