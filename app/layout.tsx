import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import AuthSessionRecovery from '@/components/AuthSessionRecovery'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Looply — аренда вещей в Санкт-Петербурге',
  description: 'Арендуй и сдавай вещи в своём районе Петербурга',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0D0D0D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthSessionRecovery />
        {children}
      </body>
    </html>
  )
}
