'use client'

import { useEffect, useState } from 'react'
import type { BookingStatus } from '@/lib/types'
import { formatCountdown, getBookingTimeline } from '@/lib/booking-timeline'

type Props = {
  status: BookingStatus
  startDate: string
  endDate: string
  role: 'owner' | 'renter'
  renterPickupConfirmed: boolean
  ownerHandoverConfirmed: boolean
}

export default function BookingTimeline({
  status,
  startDate,
  endDate,
  role,
  renterPickupConfirmed,
  ownerHandoverConfirmed,
}: Props) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(tick)
  }, [])

  const handoverDone = role === 'renter'
    ? renterPickupConfirmed
    : ownerHandoverConfirmed

  const info = getBookingTimeline(status, startDate, endDate, role, handoverDone, now)
  if (!info) return null

  const countdown = info.timerMs != null ? formatCountdown(info.timerMs) : null

  return (
    <div style={{
      margin: '0 14px 10px',
      padding: '12px 14px',
      borderRadius: 12,
      background: info.bg,
      border: `1px solid ${info.border}`,
    }}>
      <p style={{ color: info.accent, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        {info.headline}
      </p>
      <p style={{ color: '#A0A0A0', fontSize: 12, lineHeight: 1.45, marginBottom: countdown ? 10 : 0 }}>
        {info.hint}
      </p>
      {countdown && info.timerLabel && (
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
          paddingTop: 8, borderTop: `1px solid ${info.border}`,
        }}>
          <span style={{ color: '#606060', fontSize: 12 }}>{info.timerLabel}</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{countdown}</span>
        </div>
      )}
    </div>
  )
}
