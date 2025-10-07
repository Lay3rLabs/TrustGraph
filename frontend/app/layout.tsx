import './globals.css'

import type { Metadata, Viewport } from 'next'
import { Roboto_Mono } from 'next/font/google'

import { DisclaimerModal } from '@/components/DisclaimerModal'
import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { Providers } from '@/components/providers'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  icons: {
    icon: '/en0va-white.png',
  },
  title: 'EN0VA',
  description: 'what we imagine together becomes',
  openGraph: {
    title: 'EN0VA',
    description: 'what we imagine together becomes',
    url: 'https://en0va.xyz',
    siteName: 'EN0VA',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'what we imagine together becomes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EN0VA',
    description: 'what we imagine together becomes',
    site: '@0xEN0VA',
    creator: '@0xEN0VA',
    images: ['/og-image.png'],
  },
  applicationName: 'EN0VA',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        className={`${robotoMono.variable} font-mono dynamic-bg text-primary-foreground`}
      >
        <Providers>
          <div className="min-h-screen p-2 sm:p-4 md:p-6 flex flex-col root">
            <Nav />

            <main className="p-2 mt-2 sm:p-4 sm:mt-6 flex-1">{children}</main>

            <Footer />

            <DisclaimerModal />
          </div>
        </Providers>
      </body>
    </html>
  )
}
