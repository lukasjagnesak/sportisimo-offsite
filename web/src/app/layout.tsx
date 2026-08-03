import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Uklidno – najděte si uklízečku, se kterou to klapne",
    template: "%s | Uklidno",
  },
  description:
    "Zadejte poptávku, vyberte si z reakcí prověřených uklízeček podle hodnocení a dostupnosti a plánujte úklidy v kalendáři. Bez agentury a bez provize z každé hodiny.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "Uklidno",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
