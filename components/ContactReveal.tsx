import Link from 'next/link'
import type { ReactNode } from 'react'
import type { BookingStatus } from '@/lib/types'
import { CONTACT_VISIBLE_STATUSES } from '@/lib/booking-access'

type Props = {
  isLoggedIn: boolean
  hasContactAccess: boolean
  bookingStatus: BookingStatus | null
  bookingId?: string | null
  phone: string | null
  pickupNote: string | null
  pickupHours: string | null
  isOwner?: boolean
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
  }
  return phone
}

export default function ContactReveal({
  isLoggedIn,
  hasContactAccess,
  bookingStatus,
  bookingId,
  phone,
  pickupNote,
  pickupHours,
  isOwner = false,
}: Props) {
  if (hasContactAccess) {
    const hasAny = phone || pickupNote || pickupHours

    return (
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 10 }}>
          {isOwner ? 'Контакты для арендаторов' : 'Контакты для встречи'}
        </h2>
        <div style={{
          background: 'rgba(76,175,80,0.08)',
          border: '1px solid rgba(76,175,80,0.25)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {isOwner && (
            <p style={{ color: '#4CAF50', fontSize: 12, lineHeight: 1.4 }}>
              Арендаторы увидят эти данные после подтверждения брони
            </p>
          )}

          {phone ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>📞</span>
              <div>
                <p style={{ color: '#606060', fontSize: 11, marginBottom: 2 }}>Телефон</p>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  style={{ color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
                >
                  {formatPhone(phone)}
                </a>
              </div>
            </div>
          ) : !isOwner ? (
            <p style={{ color: '#A0A0A0', fontSize: 13 }}>
              Владелец не указал телефон — напишите в чат после подтверждения брони
            </p>
          ) : (
            <p style={{ color: '#FF8A8A', fontSize: 13 }}>
              Добавьте телефон в профиле, чтобы арендаторы могли связаться с вами
            </p>
          )}

          {(pickupNote || pickupHours) && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div>
                <p style={{ color: '#606060', fontSize: 11, marginBottom: 2 }}>Место встречи</p>
                {pickupNote && (
                  <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5 }}>{pickupNote}</p>
                )}
                {pickupHours && (
                  <p style={{ color: '#A0A0A0', fontSize: 13, marginTop: pickupNote ? 4 : 0 }}>
                    Время: {pickupHours}
                  </p>
                )}
              </div>
            </div>
          )}

          {!hasAny && isOwner && (
            <p style={{ color: '#A0A0A0', fontSize: 13 }}>
              Укажите место самовывоза в настройках доступности
            </p>
          )}

          {bookingId && !isOwner && (
            <Link
              href={`/bookings?openChat=${bookingId}`}
              style={{
                display: 'block', textAlign: 'center', marginTop: 4,
                padding: '11px', borderRadius: 10,
                background: 'rgba(123,92,240,0.18)',
                border: '1px solid rgba(123,92,240,0.35)',
                color: '#B89CFF', fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}
            >
              💬 Открыть чат
            </Link>
          )}
        </div>
      </div>
    )
  }

  let icon = '🔒'
  let title = 'Контакты скрыты'
  let description = 'Телефон и адрес встречи откроются после того, как владелец подтвердит вашу заявку.'
  let action: ReactNode = null

  if (!isLoggedIn) {
    icon = '🔐'
    title = 'Войдите, чтобы забронировать'
    description = 'После регистрации вы увидите описание и сможете отправить заявку. Контакты — только после подтверждения.'
    action = (
      <Link
        href="/auth"
        style={{
          display: 'inline-block', marginTop: 12,
          color: '#7B5CF0', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Войти →
      </Link>
    )
  } else if (bookingStatus === 'pending') {
    icon = '⏳'
    title = 'Ожидаем подтверждения'
    description = 'Владелец ещё не принял заявку. Как только бронь подтвердят — здесь появятся телефон и адрес встречи.'
    action = (
      <Link
        href="/bookings"
        style={{
          display: 'inline-block', marginTop: 12,
          color: '#7B5CF0', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Мои бронирования →
      </Link>
    )
  } else if (bookingStatus && !CONTACT_VISIBLE_STATUSES.includes(bookingStatus)) {
    description = 'Контакты были доступны во время активной аренды.'
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 10 }}>Контакты</h2>
      <div style={{
        background: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderRadius: 14,
        padding: '16px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</p>
        <p style={{ color: '#606060', fontSize: 13, lineHeight: 1.5 }}>{description}</p>
        {action}
      </div>
    </div>
  )
}
