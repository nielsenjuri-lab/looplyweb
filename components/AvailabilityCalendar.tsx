'use client'

import { useState } from 'react'

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

export type AvailableSlot = {
  date: string
  time_from: string
  time_to: string
}

type Props = {
  value: AvailableSlot[]
  onChange: (slots: AvailableSlot[]) => void
}

export default function AvailabilityCalendar({ value, onChange }: Props) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [globalTimeFrom, setGlobalTimeFrom] = useState('18:00')
  const [globalTimeTo, setGlobalTimeTo] = useState('21:00')
  const [useIndividualTime, setUseIndividualTime] = useState(false)
  const [applied, setApplied] = useState(false)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  const slotMap = new Map(value.map(s => [s.date, s]))

  function toggleDate(dateStr: string) {
    if (dateStr < todayStr) return
    if (slotMap.has(dateStr)) {
      onChange(value.filter(s => s.date !== dateStr))
      if (expandedDate === dateStr) setExpandedDate(null)
    } else {
      onChange([...value, { date: dateStr, time_from: globalTimeFrom, time_to: globalTimeTo }])
      if (useIndividualTime) setExpandedDate(dateStr)
    }
  }

  function updateSlotTime(dateStr: string, field: 'time_from' | 'time_to', val: string) {
    onChange(value.map(s => s.date === dateStr ? { ...s, [field]: val } : s))
  }

  function applyGlobalTime() {
    onChange(value.map(s => ({ ...s, time_from: globalTimeFrom, time_to: globalTimeTo })))
    setApplied(true)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedThisMonth = value.filter(s => {
    const [y, m] = s.date.split('-').map(Number)
    return y === year && m === month + 1
  })

  return (
    <div>
      {/* Global time setting */}
      <div style={{
        background: '#1A1A1A', borderRadius: 14, padding: '14px 16px', marginBottom: 16,
        border: '1px solid #2A2A2A',
      }}>
        <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          🕐 Время выдачи для всех дней
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>С</label>
            <input
              type="time"
              value={globalTimeFrom}
              onChange={(e) => { setGlobalTimeFrom(e.target.value); setApplied(false) }}
              style={{ padding: '8px 12px', fontSize: 14 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>До</label>
            <input
              type="time"
              value={globalTimeTo}
              onChange={(e) => { setGlobalTimeTo(e.target.value); setApplied(false) }}
              style={{ padding: '8px 12px', fontSize: 14 }}
            />
          </div>
          <button
            type="button"
            onClick={applyGlobalTime}
            style={{
              background: applied ? 'rgba(76,175,80,0.2)' : 'rgba(123,92,240,0.15)',
              border: `1px solid ${applied ? 'rgba(76,175,80,0.4)' : 'rgba(123,92,240,0.3)'}`,
              borderRadius: 10, padding: '10px 12px',
              color: applied ? '#4CAF50' : '#7B5CF0',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {applied ? '✓ Применено' : 'Применить'}
          </button>
        </div>

        {/* Applied summary */}
        {applied && value.length > 0 && (
          <div style={{
            marginTop: 10,
            background: 'rgba(76,175,80,0.1)',
            border: '1px solid rgba(76,175,80,0.25)',
            borderRadius: 10, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: '#4CAF50', fontSize: 13 }}>✓</span>
            <span style={{ color: '#4CAF50', fontSize: 13 }}>
              Для всех {value.length} {value.length === 1 ? 'дня' : value.length < 5 ? 'дней' : 'дней'}: {globalTimeFrom} — {globalTimeTo}
            </span>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useIndividualTime}
            onChange={(e) => setUseIndividualTime(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span style={{ color: '#A0A0A0', fontSize: 12 }}>Разное время для каждого дня</span>
        </label>
      </div>

      {/* Calendar navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '6px 16px', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >‹</button>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '6px 16px', color: '#fff', fontSize: 18, cursor: 'pointer' }}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#606060', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = formatDate(year, month, day)
          const isPast = dateStr < todayStr
          const isSelected = slotMap.has(dateStr)
          const isToday = dateStr === todayStr

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => toggleDate(dateStr)}
              disabled={isPast}
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isToday ? 700 : 400,
                border: isToday ? '2px solid #7B5CF0' : '1px solid transparent',
                background: isSelected
                  ? 'rgba(76,175,80,0.25)'
                  : isPast ? 'transparent' : '#1A1A1A',
                color: isSelected ? '#4CAF50' : isPast ? '#2A2A2A' : '#fff',
                cursor: isPast ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {day}
              {isSelected && (
                <span style={{
                  position: 'absolute', bottom: 3, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#4CAF50',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: '#606060' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: 'rgba(76,175,80,0.25)', border: '1px solid #4CAF50' }} />
          Доступно
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 4, background: '#1A1A1A', border: '1px solid #2A2A2A' }} />
          Нажмите чтобы добавить
        </div>
      </div>

      {/* Individual time per day */}
      {useIndividualTime && value.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <p style={{ color: '#A0A0A0', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Время по дням:
          </p>
          {[...value].sort((a, b) => a.date.localeCompare(b.date)).map(slot => (
            <div key={slot.date} style={{
              background: '#1A1A1A',
              border: expandedDate === slot.date ? '1px solid rgba(123,92,240,0.4)' : '1px solid #2A2A2A',
              borderRadius: 12,
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Row header — click to expand/collapse */}
              <button
                type="button"
                onClick={() => setExpandedDate(expandedDate === slot.date ? null : slot.date)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', cursor: 'pointer',
                }}
              >
                <span style={{ color: '#4CAF50', fontSize: 13, fontWeight: 600 }}>
                  {new Date(slot.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#A0A0A0', fontSize: 12 }}>
                    {slot.time_from} — {slot.time_to}
                  </span>
                  <span style={{ color: '#606060', fontSize: 14 }}>
                    {expandedDate === slot.date ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Expanded time inputs */}
              {expandedDate === slot.date && (
                <div style={{
                  display: 'flex', gap: 10, padding: '0 14px 12px',
                  alignItems: 'center',
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>С</label>
                    <input
                      type="time"
                      value={slot.time_from}
                      onChange={(e) => updateSlotTime(slot.date, 'time_from', e.target.value)}
                      style={{ padding: '8px 10px', fontSize: 14 }}
                    />
                  </div>
                  <span style={{ color: '#606060', fontSize: 14, marginTop: 18 }}>—</span>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, color: '#606060', marginBottom: 4 }}>До</label>
                    <input
                      type="time"
                      value={slot.time_to}
                      onChange={(e) => updateSlotTime(slot.date, 'time_to', e.target.value)}
                      style={{ padding: '8px 10px', fontSize: 14 }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Global time summary (when not in individual mode) */}
      {!useIndividualTime && value.length > 0 && (
        <p style={{ color: '#4CAF50', fontSize: 12, marginTop: 8 }}>
          ✓ Выбрано {value.length} {value.length === 1 ? 'день' : value.length < 5 ? 'дня' : 'дней'}
        </p>
      )}
    </div>
  )
}
