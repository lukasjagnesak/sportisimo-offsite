import type { Metadata } from 'next'
import { Fredoka, Quicksand } from 'next/font/google'
import { AppProvider } from '@/lib/context/app-context'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DreamyTales – Personalized Bedtime Stories',
  description:
    'Turn your child into the hero of their own bedtime story. Personalized AI-generated tales delivered as a beautiful PDF booklet every evening.',
  keywords: [
    'bedtime stories', 'personalized stories for kids', 'AI stories',
    'children stories', 'bedtime PDF', 'DreamyTales', 'pohádky na dobrou noc',
  ],
  authors: [{ name: 'DreamyTales' }],
  creator: 'DreamyTales',
  openGraph: {
    title: 'DreamyTales – Personalized Bedtime Stories',
    description: 'Personalized AI-generated bedtime stories delivered as a beautiful PDF booklet every evening.',
    url: 'https://dreamtales.eu',
    siteName: 'DreamyTales',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DreamyTales – Personalized Bedtime Stories',
    description: 'Personalized AI-generated bedtime stories delivered as a beautiful PDF booklet every evening.',
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
      lang="en"
      className={`${fredoka.variable} ${quicksand.variable} h-full`}
    >
      <body className="font-body text-slate-700 dark:text-slate-200 antialiased overflow-x-hidden">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
