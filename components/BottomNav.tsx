'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ACCENT = '#FF6B4A'
const INACTIVE = '#B5AFA9'

const tabs = [
  {
    href: '/',
    label: 'Каталог',
    requiresAuth: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" fill={active ? ACCENT : 'none'} stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill={active ? ACCENT : 'none'} stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill={active ? ACCENT : 'none'} stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill={active ? ACCENT : 'none'} stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Поиск',
    requiresAuth: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <path d="M16.5 16.5L21 21" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/create',
    label: 'Сдать',
    requiresAuth: true,
    icon: (_active: boolean) => (
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        background: ACCENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16,
        boxShadow: '0 4px 20px rgba(255,107,74,0.35)',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    ),
  },
  {
    href: '/bookings',
    label: 'Аренды',
    requiresAuth: true,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="17" rx="3" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 9h18" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 14h4M8 17h6" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Профиль',
    requiresAuth: true,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? ACCENT : INACTIVE} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [pathname])

  function handleNav(e: React.MouseEvent, href: string, requiresAuth: boolean) {
    if (requiresAuth && !userId) {
      e.preventDefault()
      router.push('/auth')
    }
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #E5DDD5',
      display: 'flex',
      alignItems: 'center',
      padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={(e) => handleNav(e, tab.href, tab.requiresAuth)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '4px 0',
              color: active ? ACCENT : INACTIVE,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              transition: 'color 0.2s',
            }}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
