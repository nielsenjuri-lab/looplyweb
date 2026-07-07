'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import BookingActions from '@/components/BookingActions'
import BookingChat from '@/components/BookingChat'
import BookingHandover from '@/components/BookingHandover'
import BookingTimeline from '@/components/BookingTimeline'
import ReviewForm from '@/components/ReviewForm'
import { CHAT_VISIBLE_STATUSES, CHAT_WRITABLE_STATUSES } from '@/lib/booking-access'
import type { BookingStatus } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Ожидает',      color: '#FFB700', bg: 'rgba(255,183,0,0.12)' },
  confirmed: { label: 'Подтверждено', color: '#8FA79A', bg: 'rgba(143,167,154,0.15)' },
  active:    { label: 'Активна',      color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  completed: { label: 'Завершена',    color: '#8C8A86', bg: 'rgba(140,138,134,0.12)' },
  cancelled: { label: 'Отменена',     color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)' },
}

type ItemInfo = { id: string; title: string; image_urls: string[]; price_per_day: number }
type PersonInfo = { id: string; name: string; avatar_url: string | null; rating?: number; review_count?: number }

type BookingRow = {
  id: string
  status: BookingStatus
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number | null
  renter_pickup_confirmed_at: string | null
  owner_handover_confirmed_at: string | null
  pickup_rejected_at: string | null
  pickup_reject_reason: string | null
  payment_captured_at: string | null
  payment_status: string | null
  item: ItemInfo | null
  person: PersonInfo | null
  personLabel: string
  role: 'owner' | 'renter'
  revieweeId: string | null
  hasReview: boolean
}

type Props = {
  asRenter: BookingRow[]
  asOwner: BookingRow[]
  currentUserId: string
  initialTab?: 'renter' | 'owner'
  initialOpenChatId?: string
}

function BookingCard({
  booking,
  onOpenChat,
  onConfirmed,
}: {
  booking: BookingRow
  currentUserId: string
  onOpenChat: (booking: BookingRow) => void
  onConfirmed: (bookingId: string) => void
}) {
  const status = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
  const item = booking.item
  const isSingleDay = booking.start_date === booking.end_date
  const chatAvailable = CHAT_VISIBLE_STATUSES.includes(booking.status)
  const chatWritable = CHAT_WRITABLE_STATUSES.includes(booking.status)

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5DDD5' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px' }}>
        <Link href={item ? `/items/${item.id}` : '#'} style={{ flexShrink: 0 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: '#EFE8E0', overflow: 'hidden',
          }}>
            {item?.image_urls?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
            )}
          </div>
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#2B2A28', fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
            {item?.title || 'Объявление'}
          </p>
          <p style={{ color: '#8C8A86', fontSize: 12 }}>
            {isSingleDay
              ? new Date(booking.start_date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
              : `${new Date(booking.start_date + 'T12:00:00').toLocaleDateString('ru-RU')} — ${new Date(booking.end_date + 'T12:00:00').toLocaleDateString('ru-RU')}`}
          </p>
          <p style={{ color: '#8C8A86', fontSize: 12, marginTop: 4 }}>
            {booking.personLabel}: {booking.person?.name || 'Пользователь'}
            {booking.person?.review_count ? ` · ★ ${Number(booking.person.rating).toFixed(1)}` : ''}
          </p>
          <p style={{ color: '#FF6B4A', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
            {booking.total_amount.toLocaleString('ru-RU')} ₽
          </p>
          <p style={{ color: '#404040', fontSize: 10, marginTop: 4 }}>
            № {booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div style={{
          padding: '4px 10px', borderRadius: 20, height: 'fit-content', flexShrink: 0,
          background: status.bg, color: status.color, fontSize: 11, fontWeight: 600,
        }}>
          {status.label}
        </div>
      </div>

      <BookingTimeline
        status={booking.status}
        startDate={booking.start_date}
        endDate={booking.end_date}
        role={booking.role}
        renterPickupConfirmed={!!booking.renter_pickup_confirmed_at}
        ownerHandoverConfirmed={!!booking.owner_handover_confirmed_at}
      />

      {chatAvailable && (
        <div style={{ padding: '0 14px 10px' }}>
          <button
            type="button"
            onClick={() => onOpenChat(booking)}
            style={{
              width: '100%', padding: '11px', borderRadius: 10,
              background: chatWritable ? 'rgba(255,107,74,0.08)' : '#FAF7F4',
              border: chatWritable ? '1px solid rgba(255,107,74,0.3)' : '1px solid #E5DDD5',
              color: chatWritable ? '#FF6B4A' : '#8C8A86',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            💬 {chatWritable ? 'Открыть чат' : 'История чата'}
          </button>
        </div>
      )}

      <BookingHandover
        booking={{
          id: booking.id,
          status: booking.status,
          total_amount: booking.total_amount,
          deposit_amount: booking.deposit_amount,
          renter_pickup_confirmed_at: booking.renter_pickup_confirmed_at,
          owner_handover_confirmed_at: booking.owner_handover_confirmed_at,
          pickup_rejected_at: booking.pickup_rejected_at,
          pickup_reject_reason: booking.pickup_reject_reason,
          payment_captured_at: booking.payment_captured_at,
          payment_status: booking.payment_status,
        }}
        role={booking.role}
      />

      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        role={booking.role}
        onConfirmed={onConfirmed}
      />

      {booking.status === 'cancelled' && booking.pickup_reject_reason && (
        <div style={{ padding: '0 14px 14px', fontSize: 12, color: '#FF8A8A', lineHeight: 1.5 }}>
          Причина отказа: {booking.pickup_reject_reason}
        </div>
      )}

      {booking.status === 'completed' && !booking.hasReview && booking.revieweeId && booking.person && (
        <ReviewForm
          bookingId={booking.id}
          revieweeId={booking.revieweeId}
          revieweeName={booking.person.name || 'пользователя'}
        />
      )}

      {booking.status === 'completed' && booking.hasReview && (
        <div style={{
          padding: '8px 14px 14px', fontSize: 12, color: '#606060',
        }}>
          ✓ Вы оставили отзыв
        </div>
      )}
    </div>
  )
}

export default function BookingsTabs({
  asRenter,
  asOwner,
  currentUserId,
  initialTab,
  initialOpenChatId,
}: Props) {
  const pendingIncoming = asOwner.filter(b => b.status === 'pending').length
  const [tab, setTab] = useState<'renter' | 'owner'>(initialTab || 'renter')
  const [chatBooking, setChatBooking] = useState<BookingRow | null>(null)
  const chatDismissed = useRef(false)
  const list = tab === 'renter' ? asRenter : asOwner
  const allBookings = [...asRenter, ...asOwner]

  function openChat(booking: BookingRow) {
    setChatBooking(booking)
  }

  function closeChat() {
    chatDismissed.current = true
    setChatBooking(null)
  }

  function openChatById(bookingId: string, optimisticStatus?: BookingStatus) {
    const found = allBookings.find(b => b.id === bookingId)
    if (found) {
      setTab(found.role === 'owner' ? 'owner' : 'renter')
      setChatBooking(optimisticStatus ? { ...found, status: optimisticStatus } : found)
    }
  }

  useEffect(() => {
    if (!initialOpenChatId || chatDismissed.current) return
    openChatById(initialOpenChatId)
  // Открываем чат из URL только при первом заходе, не после закрытия и refresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px 0',
        borderBottom: '1px solid #E5DDD5',
      }}>
        <button
          type="button"
          onClick={() => setTab('renter')}
          style={{
            flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
            color: tab === 'renter' ? '#2B2A28' : '#8C8A86',
            fontWeight: tab === 'renter' ? 600 : 400, fontSize: 14,
            borderBottom: tab === 'renter' ? '2px solid #FF6B4A' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          Я арендую
        </button>
        <button
          type="button"
          onClick={() => setTab('owner')}
          style={{
            flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
            color: tab === 'owner' ? '#2B2A28' : '#8C8A86',
            fontWeight: tab === 'owner' ? 600 : 400, fontSize: 14,
            borderBottom: tab === 'owner' ? '2px solid #FF6B4A' : '2px solid transparent',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Мне арендуют
          {pendingIncoming > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: '20%',
              background: '#FF4D4D', color: '#fff',
              fontSize: 10, fontWeight: 700,
              borderRadius: 10, padding: '1px 6px', minWidth: 18,
            }}>
              {pendingIncoming}
            </span>
          )}
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'renter' ? '📅' : '📬'}</p>
            <p style={{ color: '#2B2A28', fontWeight: 600, marginBottom: 6 }}>
              {tab === 'renter' ? 'Нет аренд' : 'Нет заявок'}
            </p>
            <p style={{ color: '#8C8A86', fontSize: 14 }}>
              {tab === 'renter'
                ? 'Найдите что-нибудь в каталоге'
                : 'Когда кто-то захочет взять вашу вещь — заявка появится здесь'}
            </p>
            {tab === 'renter' && (
              <Link href="/" className="btn-primary" style={{ marginTop: 20, width: 'auto', padding: '12px 24px', display: 'inline-flex' }}>
                Открыть каталог
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currentUserId={currentUserId}
                onOpenChat={openChat}
                onConfirmed={(id) => openChatById(id, 'confirmed')}
              />
            ))}
          </div>
        )}
      </div>

      {chatBooking && chatBooking.person && (
        <BookingChat
          bookingId={chatBooking.id}
          bookingStatus={chatBooking.status}
          currentUserId={currentUserId}
          otherPersonName={chatBooking.person.name || 'Пользователь'}
          itemTitle={chatBooking.item?.title || 'Объявление'}
          open={!!chatBooking}
          onClose={closeChat}
        />
      )}
    </>
  )
}
