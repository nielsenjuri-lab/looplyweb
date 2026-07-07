'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Item } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { createBookingRequest } from '@/lib/booking-api'

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

const MAX_RENT_DAYS = 7

function getDatesInRange(start: string, end: string): string[] {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cur = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  const dates: string[] = []
  while (cur <= last) {
    dates.push(formatDate(cur.getFullYear(), cur.getMonth(), cur.getDate()))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function formatRangeLabel(start: string, end: string) {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  const days = getDatesInRange(start, end).length
  if (start === end) {
    return s.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const range = sameMonth
    ? `${s.getDate()} — ${e.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
    : `${s.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
  return `${range} (${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'})`
}

export default function BookingWidget({ item, currentUserId, initialSlots, initialBookedDates }: {
  item: Item
  currentUserId: string | null
  initialSlots: AvailableSlot[]
  initialBookedDates: string[]
}) {
  const router = useRouter()
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const availableSlots = initialSlots
  const bookedDates = initialBookedDates
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isOwner = currentUserId === item.owner_id

  useEffect(() => { setMounted(true) }, [])

  const slotMap = new Map(availableSlots.map(s => [s.date, s]))
  const hasAvailability = availableSlots.length > 0

  function isAvailable(dateStr: string) {
    if (dateStr < todayStr) return false
    if (bookedDates.includes(dateStr)) return false
    if (hasAvailability) return slotMap.has(dateStr)
    return true
  }

  const effectiveEnd = rangeEnd || rangeStart
  const dayCount = rangeStart ? getDatesInRange(rangeStart, effectiveEnd).length : 0
  const totalPrice = dayCount * item.price_per_day
  const selectedSlot = rangeStart ? slotMap.get(rangeStart) : undefined
  const rangeComplete = !!rangeStart

  function handleDateClick(dateStr: string) {
    if (!isAvailable(dateStr)) return
    setError('')

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateStr)
      setRangeEnd('')
      return
    }

    if (dateStr < rangeStart) {
      setRangeStart(dateStr)
      setRangeEnd('')
      return
    }

    const dates = getDatesInRange(rangeStart, dateStr)
    if (dates.length > MAX_RENT_DAYS) {
      setError(`Максимум ${MAX_RENT_DAYS} дней за раз`)
      return
    }
    if (!dates.every(d => isAvailable(d))) {
      setError('В этом периоде есть недоступные дни')
      return
    }

    setRangeEnd(dateStr)
  }

  function isInRange(dateStr: string) {
    if (!rangeStart) return false
    const end = rangeEnd || rangeStart
    return dateStr >= rangeStart && dateStr <= end
  }

  async function handleBook() {
    if (!currentUserId) { router.push('/auth'); return }
    if (!rangeStart || !rangeComplete) return
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await createBookingRequest(supabase, item.id, rangeStart, effectiveEnd)
      if (error) throw error
      router.push('/bookings?success=1')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка'
      setError(msg === 'Failed to fetch' ? 'Нет связи с сервером. Проверьте интернет и попробуйте снова.' : msg)
    } finally {
      setLoading(false)
    }
  }

  // Owner view — compact bar
  if (isOwner) {
    if (!mounted) return null
    return (
      <div className="booking-bar-owner">
        <div style={{
          background: 'rgba(255,107,74,0.08)', border: '1px solid rgba(255,107,74,0.2)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 10,
          fontSize: 13, color: '#8C8A86', textAlign: 'center',
        }}>
          Это ваше объявление
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <a href={`/items/${item.id}/edit`} className="btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
            ✏️ Редактировать
          </a>
          <a href={`/items/${item.id}/availability`} className="btn-ghost" style={{ display: 'flex', justifyContent: 'center' }}>
            📅 Управлять доступностью
          </a>
        </div>
      </div>
    )
  }

  if (!mounted) return null

  if (!currentUserId) {
    return (
      <div className="booking-bar-inline">
        <div>
          <div style={{ color: '#2B2A28', fontWeight: 700, fontSize: 18 }}>
            {item.price_per_day.toLocaleString('ru-RU')} ₽
            <span style={{ color: '#8C8A86', fontSize: 13, fontWeight: 400 }}>/день</span>
          </div>
          <div style={{ color: '#8C8A86', fontSize: 12 }}>Выберите даты после входа</div>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push('/auth')}
          style={{ minWidth: 160 }}
        >
          Выбрать даты
        </button>
      </div>
    )
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <>
      {/* Backdrop */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
            zIndex: 91, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Bottom sheet with calendar */}
      <div style={{
        position: 'fixed',
        bottom: sheetOpen ? 'var(--bottom-nav-height)' : -600,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#FFFFFF',
        borderTop: '1px solid #E5DDD5',
        borderRadius: '20px 20px 0 0',
        padding: '8px 16px 20px',
        zIndex: 92,
        transition: 'bottom 0.35s cubic-bezier(0.32,0.72,0,1)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E5DDD5' }} />
        </div>

        {/* Title + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ color: '#2B2A28', fontWeight: 700, fontSize: 16 }}>Выберите даты</span>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            style={{ background: '#FAF7F4', border: '1px solid #E5DDD5', borderRadius: 8, padding: '4px 10px', color: '#8C8A86', fontSize: 16, cursor: 'pointer' }}
          >✕</button>
        </div>

        {/* Calendar header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button type="button" onClick={() => { if (month === 0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }}
            style={{ background: '#FAF7F4', border: '1px solid #E5DDD5', borderRadius: 8, padding: '4px 12px', color: '#2B2A28', fontSize: 16, cursor: 'pointer' }}>‹</button>
          <span style={{ color: '#2B2A28', fontWeight: 600, fontSize: 14 }}>{MONTH_NAMES[month]} {year}</span>
          <button type="button" onClick={() => { if (month === 11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1) }}
            style={{ background: '#FAF7F4', border: '1px solid #E5DDD5', borderRadius: 8, padding: '4px 12px', color: '#2B2A28', fontSize: 16, cursor: 'pointer' }}>›</button>
        </div>

        <p style={{ color: '#8C8A86', fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>
          Нажмите день начала, затем день окончания. До {MAX_RENT_DAYS} дней подряд.
        </p>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#B5AFA9' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 12 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const dateStr = formatDate(year, month, day)
            const available = isAvailable(dateStr)
            const inRange = isInRange(dateStr)
            const isStart = rangeStart === dateStr
            const isEnd = rangeEnd === dateStr
            const isBooked = bookedDates.includes(dateStr)

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDateClick(dateStr)}
                disabled={!available}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  fontSize: 12,
                  border: (isStart || isEnd) ? '2px solid #FF6B4A' : inRange ? '1px solid rgba(255,107,74,0.4)' : '1px solid transparent',
                  background: inRange
                    ? 'rgba(255,107,74,0.18)'
                    : available
                    ? 'rgba(143,167,154,0.15)'
                    : isBooked ? 'rgba(255,77,77,0.08)' : '#F4EDE3',
                  color: inRange ? '#FF6B4A' : available ? '#8FA79A' : '#B5AFA9',
                  cursor: available ? 'pointer' : 'not-allowed',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, color: '#8C8A86' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(143,167,154,0.35)', display: 'inline-block' }} /> Доступно
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#F4EDE3', border: '1px solid #E5DDD5', display: 'inline-block' }} /> Недоступно
          </span>
        </div>

        {/* Selected range info */}
        {rangeStart && (
          <div style={{
            background: 'rgba(255,107,74,0.07)', border: '1px solid rgba(255,107,74,0.2)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 13,
          }}>
            <span style={{ color: '#8C8A86' }}>
              📅 {formatRangeLabel(rangeStart, effectiveEnd)}
              {selectedSlot && (
                <> · 🕐 {selectedSlot.time_from.slice(0, 5)} — {slotMap.get(effectiveEnd)?.time_to.slice(0, 5) || selectedSlot.time_to.slice(0, 5)}</>
              )}
            </span>
            {!rangeEnd && (
              <p style={{ color: '#B5AFA9', fontSize: 11, marginTop: 4 }}>
                1 день — можно сразу запросить. Для периода выберите день окончания.
              </p>
            )}
            <p style={{ color: '#FF6B4A', fontSize: 13, fontWeight: 600, marginTop: 6 }}>
              Итого: {totalPrice.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        )}

        {error && <p style={{ color: '#FF4D4D', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</p>}

        <button
          className="btn-primary"
          onClick={handleBook}
          disabled={!rangeComplete || loading}
        >
          {loading ? 'Отправляем...' : rangeStart
            ? `Запросить · ${totalPrice.toLocaleString('ru-RU')} ₽`
            : 'Выберите даты'}
        </button>
      </div>

      {/* Booking bar — в потоке страницы, не перекрывает контент */}
      <div className="booking-bar-inline">
        <div>
          <div style={{ color: '#2B2A28', fontWeight: 700, fontSize: 18 }}>
            {item.price_per_day.toLocaleString('ru-RU')} ₽
            <span style={{ color: '#8C8A86', fontSize: 13, fontWeight: 400 }}>/день</span>
          </div>
          {rangeStart ? (
            <div style={{ color: '#FF6B4A', fontSize: 12 }}>
              📅 {formatRangeLabel(rangeStart, effectiveEnd)}
              {rangeComplete && ` · ${totalPrice.toLocaleString('ru-RU')} ₽`}
            </div>
          ) : (
            <div style={{ color: '#8C8A86', fontSize: 12 }}>Даты не выбраны</div>
          )}
        </div>

        {rangeComplete ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              style={{
                background: '#FAF7F4', border: '1px solid #E5DDD5',
                borderRadius: 12, padding: '10px 14px',
                color: '#8C8A86', fontSize: 13, cursor: 'pointer',
              }}
            >
              Изменить
            </button>
            <button
              className="btn-primary"
              onClick={handleBook}
              disabled={loading}
              style={{ minWidth: 130 }}
            >
              {loading ? '...' : 'Запросить'}
            </button>
          </div>
        ) : (
          <button
            className="btn-primary"
            onClick={() => setSheetOpen(true)}
            style={{ minWidth: 160 }}
          >
            Выбрать даты
          </button>
        )}
      </div>
    </>
  )
}
