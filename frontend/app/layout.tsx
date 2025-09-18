import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'

import { Nav } from '@/components/Nav'
import { Providers } from '@/components/providers'

import './globals.css'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'EN0VA',
  description: 'Egregores are watching',
  viewport:
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
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
          <div className="min-h-screen p-2 sm:p-6">
            <Nav />

            <main className="p-2 mt-4 sm:p-4 sm:mt-8 min-h-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
