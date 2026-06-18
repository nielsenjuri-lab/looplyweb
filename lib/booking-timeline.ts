import type { BookingStatus } from '@/lib/types'

export type TimelinePhase = 'before_start' | 'during' | 'after_end'

export type BookingTimelineInfo = {
  headline: string
  hint: string
  timerLabel: string | null
  timerMs: number | null
  phase: TimelinePhase | null
  accent: string
  bg: string
  border: string
}

function parseDateStart(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function parseDateEnd(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}

export function getRentalPhase(startDate: string, endDate: string, now = new Date()): TimelinePhase {
  const start = parseDateStart(startDate)
  const end = parseDateEnd(endDate)
  if (now < start) return 'before_start'
  if (now > end) return 'after_end'
  return 'during'
}

export function formatCountdown(ms: number) {
  if (ms <= 0) return '0 ч'
  const totalMinutes = Math.ceil(ms / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`)
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`)
  if (days === 0 && hours === 0 && minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'минута' : minutes < 5 ? 'минуты' : 'минут'}`)
  }
  if (parts.length === 0) return 'меньше минуты'
  return parts.join(' ')
}

export function getBookingTimeline(
  status: BookingStatus,
  startDate: string,
  endDate: string,
  role: 'owner' | 'renter',
  handoverDone: boolean,
  now = new Date(),
): BookingTimelineInfo | null {
  const phase = getRentalPhase(startDate, endDate, now)
  const start = parseDateStart(startDate)
  const end = parseDateEnd(endDate)

  if (status === 'cancelled') {
    return {
      headline: 'Аренда отменена',
      hint: 'Эта заявка больше не активна',
      timerLabel: null,
      timerMs: null,
      phase: null,
      accent: '#FF8A8A',
      bg: 'rgba(255,77,77,0.1)',
      border: 'rgba(255,77,77,0.25)',
    }
  }

  if (status === 'completed') {
    return {
      headline: 'Аренда завершена',
      hint: role === 'renter' ? 'Можете оставить отзыв ниже' : 'Ожидайте отзыв от арендатора',
      timerLabel: null,
      timerMs: null,
      phase: null,
      accent: '#A0A0A0',
      bg: 'rgba(96,96,96,0.12)',
      border: '#2A2A2A',
    }
  }

  if (status === 'pending') {
    return {
      headline: role === 'renter' ? 'Ждём ответа владельца' : 'Новая заявка — примите или отклоните',
      hint: role === 'renter'
        ? 'Когда владелец примет, появится чат и передача вещи'
        : 'После принятия арендатор увидит ваши контакты',
      timerLabel: phase === 'before_start' ? 'До начала аренды' : null,
      timerMs: phase === 'before_start' ? start.getTime() - now.getTime() : null,
      phase,
      accent: '#FFB700',
      bg: 'rgba(255,183,0,0.1)',
      border: 'rgba(255,183,0,0.25)',
    }
  }

  if (status === 'confirmed') {
    const handoverHint = role === 'renter'
      ? (handoverDone
        ? 'Вы подтвердили получение — ждём владельца'
        : 'Встретьтесь с владельцем и подтвердите свайпом ниже')
      : (handoverDone
        ? 'Арендатор подтвердил — подтвердите передачу свайпом'
        : 'Договоритесь о встрече, затем оба подтверждают передачу')

    return {
      headline: role === 'renter' ? 'Владелец принял заявку' : 'Заявка принята',
      hint: handoverHint,
      timerLabel: phase === 'before_start' ? 'До начала аренды' : 'Срок аренды',
      timerMs: phase === 'before_start'
        ? start.getTime() - now.getTime()
        : phase === 'during'
          ? end.getTime() - now.getTime()
          : null,
      phase,
      accent: '#5B8AF0',
      bg: 'rgba(91,138,240,0.1)',
      border: 'rgba(91,138,240,0.25)',
    }
  }

  if (status === 'active') {
    if (phase === 'before_start') {
      return {
        headline: 'Передача подтверждена',
        hint: role === 'renter'
          ? 'Вещь у вас — аренда начнётся в указанный день'
          : 'Вещь передана — аренда начнётся в указанный день',
        timerLabel: 'До начала аренды',
        timerMs: start.getTime() - now.getTime(),
        phase,
        accent: '#4CAF50',
        bg: 'rgba(76,175,80,0.12)',
        border: 'rgba(76,175,80,0.3)',
      }
    }

    if (phase === 'during') {
      return {
        headline: 'Аренда идёт',
        hint: role === 'renter'
          ? 'Пользуйтесь вещью и верните в срок'
          : 'Арендатор пользуется вашей вещью',
        timerLabel: 'Осталось',
        timerMs: end.getTime() - now.getTime(),
        phase,
        accent: '#4CAF50',
        bg: 'rgba(76,175,80,0.12)',
        border: 'rgba(76,175,80,0.3)',
      }
    }

    return {
      headline: 'Срок аренды вышел',
      hint: role === 'renter'
        ? 'Верните вещь владельцу как можно скорее'
        : 'Свяжитесь с арендатором о возврате',
      timerLabel: null,
      timerMs: null,
      phase,
      accent: '#FFB700',
      bg: 'rgba(255,183,0,0.1)',
      border: 'rgba(255,183,0,0.25)',
    }
  }

  return null
}
