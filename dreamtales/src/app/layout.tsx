import type { Metadata } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const crimsonText = Crimson_Text({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-crimson',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DreamTales – Pohádky na dobrou noc pro vaše dítě',
  description:
    'DreamTales každý večer vygeneruje originální, personalizovanou pohádku speciálně pro vaše dítě. Stačí vytvořit profil, vybrat oblíbený žánr a pohádka dorazí e-mailem přesně na dobrou noc.',
  keywords: [
    'pohádky pro děti',
    'pohádka na dobrou noc',
    'personalizované pohádky',
    'AI pohádky',
    'pohádky e-mailem',
    'DreamTales',
  ],
  authors: [{ name: 'DreamTales' }],
  creator: 'DreamTales',
  openGraph: {
    title: 'DreamTales – Pohádky na dobrou noc pro vaše dítě',
    description:
      'Každý večer originální pohádka speciálně pro vaše dítě – personalizovaná, krásná a doručená e-mailem.',
    url: 'https://dreamtales.eu',
    siteName: 'DreamTales',
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamTales – Pohádky na dobrou noc pro vaše dítě',
    description: 'Každý večer originální AI pohádka speciálně pro vaše dítě.',
  },
  metadataBase: new URL('https://dreamtales.eu'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="cs"
      className={`${inter.variable} ${crimsonText.variable} h-full`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-navy text-soft-white antialiased">
        {children}
      </body>
    </html>
  )
}
