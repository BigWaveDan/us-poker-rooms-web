import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import Link from "next/link";
import Nav from "@/components/Nav";
import ThemeProvider, { THEME_BOOT_SCRIPT } from "@/components/ThemeProvider";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "US Poker Rooms",
    template: "%s · US Poker Rooms",
  },
  description:
    "Data-collection UI over the sourced US live poker rooms dataset. Coverage gaps stay visible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className={`${display.variable} ${sans.variable}`}>
        <ThemeProvider>
          <div className="shell">
            <Nav />
            <main className="main">{children}</main>
            <footer className="footer">
              <p>Sourced dataset only. Rooms that are not in the API are not shown.</p>
              <p className="footer-links">
                <Link href="/about">About</Link>
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
