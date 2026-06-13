import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Excellent Motors — Premium Car Parts, Engineered for Performance",
    template: "%s · Excellent Motors",
  },
  description:
    "Premium car-modification parts in Pakistan — body kits, wheels, bucket seats, infotainment, sound systems and lighting, with live stock and pro fitment.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#07090d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read the theme preference server-side so the .dark class is in the initial
  // HTML — no flash, no client script. Light is the default.
  const isDark = (await cookies()).get("theme")?.value === "dark";

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
