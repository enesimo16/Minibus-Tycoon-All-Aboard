import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { AppShell } from "@/game/AppShell";
import "./globals.css";

const gameFont = Fredoka({
  subsets: ["latin", "latin-ext"],
  variable: "--font-game",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minibus Tycoon - All Aboard!",
  description: "Build your route, carry your passengers and grow your minibus business.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${gameFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
