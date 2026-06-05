'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Item } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

type AvailableSlot = { date: string; time_from: string; time_to: string }

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function BookingWidget({ item, currentUserId }: {
  item: Item
  currentUserId: string | null
}) {
  const router = useRouter()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dataLoaded, setDataLoaded] = useState(false)

  const isOwner = currentUserId === item.owner_id

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('item_available_dates').select('date, time_from, time_to').eq('item_id', item.id),
      supabase.from('bookings').select('start_date, end_date').eq('item_id', item.id).in('status', ['confirmed', 'active', 'pending'])
    ]).then(([{ data: slots }, { data: bookings }]) => {
      setAvailableSlots(slots || [])
      const dates: string[] = []
      ;(bookings || []).forEach(({ start_date, end_date }) => {
        const cur = new Date(start_date)
        while (cur <= new Date(end_date)) {
          dates.push(cur.toISOString().split('T')[0])
          cur.setDate(cur.getDate() + 1)
        }
      })
      setBookedDates(dates)
      setDataLoaded(true)
    })
  }, [item.id])

  const slotMap = new Map(availableSlots.map(s => [s.date, s]))
  const hasAvailability = availableSlots.length > 0

  function isAvailable(dateStr: string) {
    if (dateStr < todayStr) return false
    if (bookedDates.includes(dateStr)) return false
    if (hasAvailability) return slotMap.has(dateStr)
    return true
  }

  const selectedSlot = selectedDate ? slotMap.get(selectedDate) : undefined

  async function handleBook() {
    if (!currentUserId) { router.push('/auth'); return }
    if (!selectedDate) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('bookings').insert({
        item_id: item.id,
        owner_id: item.owner_id,
        renter_id: currentUserId,
        start_date: selectedDate,
        end_date: selectedDate,
        total_amount: item.price_per_day,
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

  // Owner view
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
          borderRadius: 12, padding: '10px 14px', marginBottom: 10,
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

  if (!dataLoaded) return null

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{
      position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480,
      background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid #2A2A2A', padding: '16px', zIndex: 90,
      maxHeight: '70vh', overflowY: 'auto',
    }}>
      {/* Pickup hours */}
      {item.pickup_hours && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: '#A0A0A0' }}>
          <span>🕐</span><span>Выдача: {item.pickup_hours}</span>
        </div>
      )}

      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button type="button" onClick={() => { if (month === 0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }}
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '4px 12px', color: '#fff', fontSize: 16, cursor: 'pointer' }}>‹</button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{MONTH_NAMES[month]} {year}</span>
        <button type="button" onClick={() => { if (month === 11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1) }}
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '4px 12px', color: '#fff', fontSize: 16, cursor: 'pointer' }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#606060' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 12 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = formatDate(year, month, day)
          const available = isAvailable(dateStr)
          const isSelected = selectedDate === dateStr
          const isBooked = bookedDates.includes(dateStr)

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => available && setSelectedDate(isSelected ? '' : dateStr)}
              disabled={!available}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                fontSize: 12,
                border: isSelected ? '2px solid #7B5CF0' : '1px solid transparent',
                background: isSelected
                  ? 'rgba(123,92,240,0.3)'
                  : available
                  ? 'rgba(76,175,80,0.15)'
                  : isBooked ? 'rgba(255,77,77,0.1)' : '#111',
                color: isSelected ? '#7B5CF0' : available ? '#4CAF50' : '#333',
                cursor: available ? 'pointer' : 'not-allowed',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 11, color: '#606060' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(76,175,80,0.3)', display: 'inline-block' }} /> Доступно
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: '#111', display: 'inline-block' }} /> Недоступно
        </span>
      </div>

      {/* Selected date info */}
      {selectedDate && selectedSlot && (
        <div style={{
          background: 'rgba(123,92,240,0.1)', border: '1px solid rgba(123,92,240,0.2)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 13,
        }}>
          <span style={{ color: '#A0A0A0' }}>
            📅 {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            {'  '}🕐 {selectedSlot.time_from.slice(0,5)} — {selectedSlot.time_to.slice(0,5)}
          </span>
        </div>
      )}

      {error && <p style={{ color: '#FF4D4D', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</p>}

      <button
        className="btn-primary"
        onClick={handleBook}
        disabled={!selectedDate || loading}
      >
        {loading ? 'Отправляем...' : selectedDate
          ? `Запросить аренду · ${item.price_per_day.toLocaleString('ru-RU')} ₽/день`
          : 'Выберите дату'}
      </button>
    </div>
  )
}
