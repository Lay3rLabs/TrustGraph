import './globals.css'

import clsx from 'clsx'
import type { Metadata, Viewport } from 'next'
import { Roboto_Mono } from 'next/font/google'

import { CRTScanlines } from '@/components/CRTScanlines'
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
  viewportFit: 'cover',
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
        <link rel="preload" href="/background.jpg" as="image" />
        <link rel="preload" href="/background_vertical.jpg" as="image" />
      </head>
      <body
        className={clsx(
          robotoMono.variable,
          'font-mono text-primary-foreground min-h-screen p-safe-or-2 sm:p-safe-or-4 md:p-safe-or-6 root flex flex-col'
        )}
      >
        <Providers>
          {/* Account for the footer, but make sure to push it down below the initial page */}
          <div className="flex flex-col min-h-[calc(100vh-2rem)]">
            <Nav />

            <main className="p-2 mt-2 sm:p-4 sm:mt-6 flex-1 grow">
              {children}
            </main>
          </div>

          <Footer />

          <DisclaimerModal />

          <CRTScanlines opacity={0.05} lineHeight={2} className="!fixed" />
        </Providers>
      </body>
    </html>
  )
}
