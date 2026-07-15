import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CryptoVoice - Multi-Wallet Crypto Platform',
  description: 'CryptoVoice - Work with Binance, TrustWallet, and any crypto wallet. Earn daily profit with BEP20 support and balance management',
  generator: 'v0.app',
  icons: {
    icon: '/usdt-logo.png',
    shortcut: '/usdt-logo.png',
    apple: '/usdt-logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f59e0b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-white">
      <body className="antialiased bg-white">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
