import type { Metadata, Viewport } from 'next'
import AuthSessionRecovery from '@/components/AuthSessionRecovery'
import './globals.css'

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
  themeColor: '#FF6B4A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <AuthSessionRecovery />
        {children}
      </body>
    </html>
  )
}
