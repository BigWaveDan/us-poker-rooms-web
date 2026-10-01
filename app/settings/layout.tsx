import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "App settings, theme, and room data tools.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
