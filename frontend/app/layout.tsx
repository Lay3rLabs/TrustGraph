import './globals.css'

import clsx from 'clsx'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ReactNode } from 'react'

import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { Providers } from '@/components/providers'

const paperMono = localFont({
  src: '../public/fonts/PaperMono-Regular.woff2',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TrustGraph',
  description: 'Mapping trust networks through attestations.',
  applicationName: 'Trust Graph',
  icons: [
    {
      url: '/images/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      url: '/images/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
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
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <head></head>
      <body className={clsx(paperMono.variable, 'font-mono text-foreground')}>
        <div className="min-h-screen root flex flex-col p-safe-or-2 sm:p-safe-or-4 md:p-safe-or-6 max-w-7xl mx-auto">
          <Providers>
            {/* Account for the footer, but make sure to push it down below the initial page */}
            <div className="flex flex-col min-h-[calc(100vh-2rem)]">
              <Nav />

              <main className="p-2 mt-4 sm:px-0 sm:py-4 sm:mt-6 flex-1 grow">
                {children}
              </main>
            </div>

            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  )
}
