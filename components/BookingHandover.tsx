'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SwipeConfirm from '@/components/SwipeConfirm'
import {
  buildPaymentCapturePayload,
  buildPickupRejectPayload,
  isHandoverComplete,
} from '@/lib/booking-handover'
import type { HandoverBooking } from '@/lib/booking-handover'

type Props = {
  booking: HandoverBooking
  role: 'owner' | 'renter'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function BookingHandover({ booking, role }: Props) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (booking.status !== 'confirmed') return null
  if (booking.pickup_rejected_at) return null

  const renterDone = !!booking.renter_pickup_confirmed_at
  const ownerDone = !!booking.owner_handover_confirmed_at
  const deposit = booking.deposit_amount ?? 0
  const rent = booking.total_amount

  async function confirmPickup() {
    setError('')
    const supabase = createClient()
    const now = new Date().toISOString()
    const field = role === 'renter' ? 'renter_pickup_confirmed_at' : 'owner_handover_confirmed_at'

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ [field]: now })
      .eq('id', booking.id)

    if (updateError) throw new Error(updateError.message)

    const { data: fresh } = await supabase
      .from('bookings')
      .select('renter_pickup_confirmed_at, owner_handover_confirmed_at')
      .eq('id', booking.id)
      .single()

    if (fresh?.renter_pickup_confirmed_at && fresh?.owner_handover_confirmed_at) {
      const { error: activateError } = await supabase
        .from('bookings')
        .update(buildPaymentCapturePayload())
        .eq('id', booking.id)

      if (activateError) throw new Error(activateError.message)
    }

    router.refresh()
  }

  async function submitReject() {
    const reason = rejectReason.trim()
    if (!reason) {
      setError('Укажите причину отказа')
      return
    }
    if (reason.length > 500) {
      setError('Максимум 500 символов')
      return
    }

    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: rejectError } = await supabase
      .from('bookings')
      .update(buildPickupRejectPayload(reason))
      .eq('id', booking.id)

    if (rejectError) {
      setError(rejectError.message)
    } else {
      setShowReject(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        background: 'rgba(91,138,240,0.1)', border: '1px solid rgba(91,138,240,0.25)',
        borderRadius: 12, padding: '12px 14px',
      }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
          🤝 Передача вещи
        </p>
        <p style={{ color: '#A0A0A0', fontSize: 12, lineHeight: 1.5 }}>
          Осмотрите вещь на встрече. Оба подтверждают свайпом — после этого списываются
          {' '}{rent.toLocaleString('ru-RU')} ₽ аренды
          {deposit > 0 ? ` и замораживается депозит ${deposit.toLocaleString('ru-RU')} ₽` : ''}.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
        <StatusChip done={renterDone} label="Арендатор" time={booking.renter_pickup_confirmed_at} />
        <StatusChip done={ownerDone} label="Владелец" time={booking.owner_handover_confirmed_at} />
      </div>

      {role === 'renter' && !renterDone && (
        <>
          {!showReject ? (
            <>
              <SwipeConfirm
                label="Подтверждаю — забрал вещь"
                color="#4CAF50"
                onConfirm={confirmPickup}
              />
              <button
                type="button"
                onClick={() => setShowReject(true)}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.25)',
                  color: '#FF4D4D', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ✕ Отказаться от аренды
              </button>
            </>
          ) : (
            <div style={{
              background: '#1A1A1A', borderRadius: 12, padding: '12px',
              border: '1px solid rgba(255,77,77,0.25)',
            }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Вещь не соответствует ожиданиям
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value.slice(0, 500))}
                placeholder="Опишите причину (макс. 500 символов)..."
                rows={4}
                maxLength={500}
                style={{ resize: 'vertical', marginBottom: 8 }}
              />
              <p style={{ color: '#606060', fontSize: 11, marginBottom: 8, textAlign: 'right' }}>
                {rejectReason.length}/500
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setShowReject(false); setRejectReason(''); setError('') }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: '#222', border: '1px solid #2A2A2A', color: '#A0A0A0', fontSize: 13,
                  }}
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={submitReject}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10,
                    background: 'rgba(255,77,77,0.2)', border: '1px solid rgba(255,77,77,0.35)',
                    color: '#FF4D4D', fontSize: 13, fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? '...' : 'Отправить отказ'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {role === 'owner' && !ownerDone && (
        <SwipeConfirm
          label="Подтверждаю — отдал вещь"
          color="#5B8AF0"
          disabled={!renterDone}
          onConfirm={confirmPickup}
        />
      )}

      {role === 'owner' && !ownerDone && !renterDone && (
        <p style={{ color: '#606060', fontSize: 12, textAlign: 'center' }}>
          Сначала арендатор подтверждает осмотр и получение
        </p>
      )}

      {isHandoverComplete(booking) && booking.payment_captured_at && (
        <div style={{
          background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
          borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#4CAF50',
        }}>
          ✓ Оплата зафиксирована · {formatTime(booking.payment_captured_at)}
          <br />
          <span style={{ color: '#A0A0A0' }}>
            {rent.toLocaleString('ru-RU')} ₽ аренда
            {deposit > 0 ? ` · ${deposit.toLocaleString('ru-RU')} ₽ депозит заморожен` : ''}
          </span>
        </div>
      )}

      {error && (
        <p style={{ color: '#FF8A8A', fontSize: 12 }}>⚠️ {error}</p>
      )}
    </div>
  )
}

function StatusChip({
  done,
  label,
  time,
}: {
  done: boolean
  label: string
  time: string | null | undefined
}) {
  return (
    <div style={{
      flex: 1, padding: '8px 10px', borderRadius: 10, textAlign: 'center',
      background: done ? 'rgba(76,175,80,0.12)' : 'rgba(96,96,96,0.12)',
      border: `1px solid ${done ? 'rgba(76,175,80,0.3)' : '#2A2A2A'}`,
    }}>
      <p style={{ color: done ? '#4CAF50' : '#606060', fontWeight: 600, fontSize: 11 }}>{label}</p>
      <p style={{ color: '#606060', fontSize: 10, marginTop: 2 }}>
        {done && time ? formatTime(time) : 'ожидает'}
      </p>
    </div>
  )
}
