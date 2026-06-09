'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function AvailabilityManager({ itemId, pickupHours, pickupNote, unavailableDates, bookedDates = [] }: {
  itemId: string
  pickupHours: string
  pickupNote: string
  unavailableDates: string[]
  bookedDates?: string[]
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const bookedSet = new Set(bookedDates)
  const [blocked, setBlocked] = useState<Set<string>>(new Set(unavailableDates))
  const [hours, setHours] = useState(pickupHours)
  const [note, setNote] = useState(pickupNote)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const todayStr = today.toISOString().split('T')[0]

  function toggleDate(dateStr: string) {
    if (dateStr < todayStr) return
    if (bookedSet.has(dateStr)) return // занято арендой — нельзя менять
    setBlocked((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
    setSaved(false)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()

    // Update pickup hours and note
    await supabase.from('items').update({
      pickup_hours: hours || null,
      pickup_note: note || null,
    }).eq('id', itemId)

    // Delete all existing unavailable dates for this item
    await supabase.from('item_unavailable_dates').delete().eq('item_id', itemId)

    // Insert new blocked dates
    if (blocked.size > 0) {
      await supabase.from('item_unavailable_dates').insert(
        Array.from(blocked).map(date => ({ item_id: itemId, date }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={{ padding: '20px 16px' }}>

      {/* Pickup hours */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', fontWeight: 500, marginBottom: 6 }}>
          🕐 Время выдачи
        </label>
        <input
          value={hours}
          onChange={(e) => { setHours(e.target.value); setSaved(false) }}
          placeholder="Например: Пн–Пт после 19:00, Сб–Вс 10:00–15:00"
        />
        <p style={{ color: '#606060', fontSize: 11, marginTop: 4 }}>Арендатор увидит это на странице объявления</p>
      </div>

      {/* Pickup note */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', fontWeight: 500, marginBottom: 6 }}>
          📍 Место и условия самовывоза
        </label>
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false) }}
          placeholder="Например: метро Невский пр., договариваемся в чате. Прошу не звонить после 21:00."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Calendar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '6px 14px', color: '#fff', fontSize: 18 }}>‹</button>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '6px 14px', color: '#fff', fontSize: 18 }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#606060', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = formatDate(year, month, day)
            const isPast = dateStr < todayStr
            const isBooked = bookedSet.has(dateStr)
            const isBlocked = blocked.has(dateStr) && !isBooked
            const isToday = dateStr === todayStr

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(dateStr)}
                disabled={isPast || isBooked}
                style={{
                  aspectRatio: '1',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: isToday ? 700 : 400,
                  border: isToday ? '2px solid #7B5CF0' : isBooked ? '1px solid rgba(255,77,77,0.5)' : '1px solid transparent',
                  background: isBooked
                    ? 'rgba(255,77,77,0.35)'
                    : isBlocked
                    ? 'rgba(255,77,77,0.25)'
                    : isPast
                    ? 'transparent'
                    : '#1A1A1A',
                  color: isBooked || isBlocked
                    ? '#FF4D4D'
                    : isPast
                    ? '#333'
                    : '#fff',
                  cursor: isPast || isBooked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, fontSize: 12, color: '#606060' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: '#1A1A1A', border: '1px solid #2A2A2A' }} />
          Доступно
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(255,77,77,0.35)', border: '1px solid rgba(255,77,77,0.5)' }} />
          Занято (аренда)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(255,77,77,0.25)' }} />
          Закрыто вами
        </div>
      </div>

      {bookedDates.length > 0 && (
        <div style={{
          background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FF8A8A',
        }}>
          🔴 Занято {bookedDates.length} {bookedDates.length === 1 ? 'день' : bookedDates.length < 5 ? 'дня' : 'дней'} — есть активные заявки или аренды
        </div>
      )}

      <p style={{ color: '#606060', fontSize: 12, marginBottom: 16 }}>
        Нажмите на дату чтобы закрыть её вручную. Красные даты с арендой менять нельзя.
      </p>

      <button
        className="btn-primary"
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Сохраняем...' : saved ? '✓ Сохранено!' : 'Сохранить настройки'}
      </button>
    </div>
  )
}
