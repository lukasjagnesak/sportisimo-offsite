import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import Providers from "@/components/Providers"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CoParent Hub",
  description: "Sdílená péče o děti – kalendář, výdaje, aktivity",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={geistSans.variable}>
      <body className="bg-slate-50 min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
