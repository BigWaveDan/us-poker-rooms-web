import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Push / Fold",
  description:
    "Tournament push/fold charts by ante, position, and stack (study reference).",
};

export default function PushFoldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
