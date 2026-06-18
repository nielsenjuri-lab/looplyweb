'use client'

import { useEffect, useState } from 'react'
import type { BookingStatus } from '@/lib/types'

type Props = {
  latestRenterStatus: BookingStatus | null
}

export default function BookingSuccessBanner({ latestRenterStatus }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.has('success')) {
      url.searchParams.delete('success')
      window.history.replaceState({}, '', url.pathname + (url.search || ''))
    }
  }, [])

  if (!visible || !latestRenterStatus) return null

  let message: string
  let color = '#4CAF50'
  let bg = 'rgba(76,175,80,0.12)'
  let border = 'rgba(76,175,80,0.3)'

  if (latestRenterStatus === 'pending') {
    message = 'Заявка отправлена! Ждите подтверждения от владельца.'
  } else if (latestRenterStatus === 'confirmed') {
    message = 'Владелец принял заявку! Договоритесь о встрече и подтвердите передачу.'
  } else if (latestRenterStatus === 'active') {
    message = 'Аренда активна — смотрите таймер на карточке ниже.'
  } else {
    return null
  }

  return (
    <div style={{
      margin: '16px 16px 0',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ flexShrink: 0 }}>✅</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color, fontSize: 14, lineHeight: 1.45 }}>{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          style={{
            marginTop: 8, background: 'transparent', border: 'none',
            color: '#A0A0A0', fontSize: 12, cursor: 'pointer', padding: 0,
          }}
        >
          Скрыть
        </button>
      </div>
    </div>
  )
}
