'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { bookingStatusAction, type BookingAction } from '@/lib/booking-api'
import type { BookingStatus } from '@/lib/types'

type Props = {
  bookingId: string
  status: BookingStatus
  role: 'owner' | 'renter'
  onConfirmed?: (bookingId: string) => void
}

export default function BookingActions({ bookingId, status, role, onConfirmed }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [error, setError] = useState('')

  async function runAction(action: BookingAction) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: rpcError } = await bookingStatusAction(supabase, bookingId, action)

    if (rpcError) {
      setError(rpcError.message)
    } else {
      if (action === 'owner_confirm') onConfirmed?.(bookingId)
      router.refresh()
    }
    setLoading(false)
    setConfirmReject(false)
  }

  if (role === 'owner' && status === 'pending') {
    return (
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => runAction('owner_confirm')}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: 'rgba(76,175,80,0.15)',
              border: '1px solid rgba(76,175,80,0.3)',
              color: '#4CAF50', fontWeight: 600, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            ✓ Принять
          </button>
          <button
            type="button"
            onClick={() => confirmReject ? runAction('owner_reject') : setConfirmReject(true)}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', borderRadius: 10,
              background: confirmReject ? 'rgba(255,77,77,0.2)' : 'rgba(255,77,77,0.1)',
              border: '1px solid rgba(255,77,77,0.3)',
              color: '#FF4D4D', fontWeight: 600, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {confirmReject ? 'Точно отклонить?' : '✕ Отклонить'}
          </button>
        </div>
        {error && <p style={{ color: '#FF8A8A', fontSize: 12 }}>⚠️ {error}</p>}
      </div>
    )
  }

  if (role === 'owner' && status === 'active') {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <button
          type="button"
          onClick={() => runAction('owner_complete')}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            background: 'rgba(123,92,240,0.15)',
            border: '1px solid rgba(123,92,240,0.3)',
            color: '#7B5CF0', fontWeight: 600, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          ✓ Завершить аренду
        </button>
        {error && <p style={{ color: '#FF8A8A', fontSize: 12, marginTop: 8 }}>⚠️ {error}</p>}
      </div>
    )
  }

  if (role === 'renter' && status === 'pending') {
    return (
      <div style={{ padding: '0 14px 14px' }}>
        <button
          type="button"
          onClick={() => runAction('renter_cancel')}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 10,
            background: 'rgba(255,77,77,0.1)',
            border: '1px solid rgba(255,77,77,0.25)',
            color: '#FF4D4D', fontWeight: 600, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Отменить заявку
        </button>
        {error && <p style={{ color: '#FF8A8A', fontSize: 12, marginTop: 8 }}>⚠️ {error}</p>}
      </div>
    )
  }

  return null
}
