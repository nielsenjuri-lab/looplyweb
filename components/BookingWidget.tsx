'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Item } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function BookingWidget({ item }: { item: Item }) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0

  const total = days * item.price_per_day

  async function handleBook() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth')
      return
    }

    if (!startDate || !endDate) return

    setLoading(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        item_id: item.id,
        owner_id: item.owner_id,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
        total_amount: total,
        deposit_amount: item.deposit,
        status: 'pending',
      })

      if (error) throw error
      router.push('/bookings?success=1')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 64,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(13,13,13,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #2A2A2A',
      padding: '16px',
      zIndex: 90,
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>С</label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '10px 12px', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>По</label>
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '10px 12px', fontSize: 14 }}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleBook}
        disabled={!startDate || !endDate || loading}
      >
        {loading ? 'Отправляем...' : days > 0
          ? `Арендовать · ${total.toLocaleString('ru-RU')} ₽ за ${days} дн.`
          : 'Выберите даты'}
      </button>
    </div>
  )
}
