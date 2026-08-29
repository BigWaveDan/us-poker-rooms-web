import type { Metadata } from "next";
import { Fraunces, Figtree } from "next/font/google";
import Nav from "@/components/Nav";
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
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <div className="shell">
          <Nav />
          <main className="main">{children}</main>
          <footer className="footer">
            Sourced dataset only. Rooms that are not in the API are not shown.
          </footer>
        </div>
      </body>
    </html>
  );
}
