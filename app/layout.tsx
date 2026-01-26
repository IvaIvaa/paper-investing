import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { Inter } from 'next/font/google'


const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Mobile optimization */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        {/* PWA / App-like behavior */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Status bar color (Android) */}
        <meta name="theme-color" content="#ffffff" />
      </head>

      <body className={`${inter.variable} font-sans bg-gray-50 text-gray-900`}>
        {children}
        <Analytics />
        

      </body>
    </html>
  )
}
