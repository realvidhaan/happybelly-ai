import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { TrackerProvider } from "@/lib/store";

// Rounded, friendly typeface for the playful Duolingo-style look.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "HappyBelly AI — effortless calorie & macro tracking",
  description:
    "Log meals in plain English or from a photo. HappyBelly AI estimates calories, protein, carbs and fats, adapts your TDEE, and keeps your streak alive.",
  applicationName: "HappyBelly AI",
};

export const viewport: Viewport = {
  themeColor: "#58cc02",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <TrackerProvider>{children}</TrackerProvider>
      </body>
    </html>
  );
}
