'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Item } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function BookingWidget({ item, unavailableDates, currentUserId }: {
  item: Item
  unavailableDates: string[]
  currentUserId: string | null
}) {
  const router = useRouter()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookedDates, setBookedDates] = useState<string[]>([])

  const isOwner = currentUserId === item.owner_id
  const today = new Date().toISOString().split('T')[0]

  // Load already booked dates
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('item_id', item.id)
      .in('status', ['confirmed', 'active', 'pending'])
      .then(({ data }) => {
        if (!data) return
        const dates: string[] = []
        data.forEach(({ start_date, end_date }) => {
          const cur = new Date(start_date)
          const end = new Date(end_date)
          while (cur <= end) {
            dates.push(cur.toISOString().split('T')[0])
            cur.setDate(cur.getDate() + 1)
          }
        })
        setBookedDates(dates)
      })
  }, [item.id])

  const allBlockedDates = [...unavailableDates, ...bookedDates]

  function isDateBlocked(date: string) {
    return allBlockedDates.includes(date)
  }

  function isRangeValid(start: string, end: string) {
    if (!start || !end) return true
    const cur = new Date(start)
    const endD = new Date(end)
    while (cur <= endD) {
      if (isDateBlocked(cur.toISOString().split('T')[0])) return false
      cur.setDate(cur.getDate() + 1)
    }
    return true
  }

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0
  const total = days * item.price_per_day
  const rangeValid = isRangeValid(startDate, endDate)

  async function handleBook() {
    if (!currentUserId) { router.push('/auth'); return }
    if (!startDate || !endDate) return
    if (!rangeValid) { setError('Выбранный период содержит недоступные даты'); return }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('bookings').insert({
        item_id: item.id,
        owner_id: item.owner_id,
        renter_id: currentUserId,
        start_date: startDate,
        end_date: endDate,
        total_amount: total,
        deposit_amount: item.deposit,
        status: 'pending',
      })
      if (error) throw error
      router.push('/bookings?success=1')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Owner sees management button instead of booking
  if (isOwner) {
    return (
      <div style={{
        position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid #2A2A2A', padding: '16px', zIndex: 90,
      }}>
        <div style={{
          background: 'rgba(123,92,240,0.1)', border: '1px solid rgba(123,92,240,0.2)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 10,
          fontSize: 13, color: '#A0A0A0', textAlign: 'center',
        }}>
          Это ваше объявление
        </div>
        <a href={`/items/${item.id}/availability`} className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
          📅 Управлять доступностью
        </a>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid #2A2A2A', padding: '16px', zIndex: 90,
    }}>
      {/* Pickup hours */}
      {item.pickup_hours && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
          fontSize: 12, color: '#A0A0A0',
        }}>
          <span>🕐</span>
          <span>Выдача: {item.pickup_hours}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>С</label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => { setStartDate(e.target.value); setError('') }}
            style={{ padding: '10px 12px', fontSize: 14 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>По</label>
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => { setEndDate(e.target.value); setError('') }}
            style={{ padding: '10px 12px', fontSize: 14 }}
          />
        </div>
      </div>

      {!rangeValid && (
        <p style={{ color: '#FF4D4D', fontSize: 12, marginBottom: 8 }}>
          ⚠️ В этом периоде есть недоступные даты — выберите другой
        </p>
      )}
      {error && <p style={{ color: '#FF4D4D', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</p>}

      <button
        className="btn-primary"
        onClick={handleBook}
        disabled={!startDate || !endDate || loading || !rangeValid}
      >
        {loading ? 'Отправляем...' : days > 0
          ? `Забронировать · ${total.toLocaleString('ru-RU')} ₽ за ${days} дн.`
          : 'Выберите даты'}
      </button>
    </div>
  )
}
