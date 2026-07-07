'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      router.push('/')
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка'
      if (msg.includes('Invalid login credentials')) setError('Неверный email или пароль')
      else if (msg.includes('User already registered')) setError('Email уже зарегистрирован — войдите')
      else if (msg.includes('Password should be')) setError('Пароль минимум 6 символов')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
      {/* Header */}
      <div style={{ paddingTop: 60, paddingBottom: 48, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: 18,
          background: '#FF6B4A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c-2.5-3-6-3-6 0s3.5 3 6 0zm0 0c2.5 3 6 3 6 0s-3.5-3-6 0z"
              stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2B2A28', letterSpacing: '-0.5px' }}>looply</h1>
        <p style={{ color: '#8C8A86', fontSize: 14, marginTop: 4 }}>Аренда вещей в Петербурге</p>
      </div>

      {/* Toggle */}
      <div style={{
        display: 'flex',
        background: '#EFE8E0',
        borderRadius: 14,
        padding: 4,
        marginBottom: 28,
      }}>
        {['Войти', 'Регистрация'].map((label, i) => (
          <button
            key={label}
            onClick={() => { setIsLogin(i === 0); setError('') }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: isLogin === (i === 0) ? '#FF6B4A' : 'transparent',
              color: isLogin === (i === 0) ? '#fff' : '#8C8A86',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Пароль (минимум 6 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />

        {error && (
          <div style={{
            background: 'rgba(255,77,77,0.12)',
            border: '1px solid rgba(255,77,77,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: '#FF4D4D',
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/" style={{ color: '#8C8A86', fontSize: 14 }}>
          Смотреть каталог без входа →
        </Link>
      </div>
    </div>
  )
}
