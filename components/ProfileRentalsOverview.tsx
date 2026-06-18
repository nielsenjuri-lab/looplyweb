import Link from 'next/link'
import type { BookingStatus } from '@/lib/types'
import {
  countOwnerSummary,
  formatBookingDates,
  getBookingStatusBadge,
  getProfileItemStatus,
  type ItemListingStatus,
} from '@/lib/profile-status'

type OwnerBooking = {
  id: string
  item_id: string
  status: BookingStatus
  start_date: string
  end_date: string
  renter: { name: string } | null
}

type RenterBooking = {
  id: string
  status: BookingStatus
  start_date: string
  end_date: string
  total_amount: number
  item: { id: string; title: string; image_urls: string[] } | null
  owner: { name: string } | null
}

type MyItem = {
  id: string
  title: string
  price_per_day: number
  status: ItemListingStatus
  image_urls: string[]
  reject_reason?: string | null
}

type Props = {
  myItems: MyItem[]
  ownerBookings: OwnerBooking[]
  renterBookings: RenterBooking[]
}

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: bg, color, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export default function ProfileRentalsOverview({ myItems, ownerBookings, renterBookings }: Props) {
  const bookingsByItem = new Map<string, OwnerBooking[]>()
  for (const b of ownerBookings) {
    const list = bookingsByItem.get(b.item_id) || []
    list.push(b)
    bookingsByItem.set(b.item_id, list)
  }

  const itemStatuses = myItems.map(item =>
    getProfileItemStatus(item.status, (bookingsByItem.get(item.id) || []) as OwnerBooking[]),
  )
  const summary = countOwnerSummary(itemStatuses)

  return (
    <>
      {/* Сводка */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
          Статус аренды
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: '#1A1A1A', borderRadius: 14, padding: '14px' }}>
            <p style={{ color: '#606060', fontSize: 11, marginBottom: 6 }}>Я сдаю</p>
            <p style={{ color: '#4CAF50', fontSize: 18, fontWeight: 700 }}>{summary.available}</p>
            <p style={{ color: '#606060', fontSize: 11 }}>свободно</p>
            <p style={{ color: '#7B5CF0', fontSize: 14, fontWeight: 600, marginTop: 8 }}>{summary.inProgress}</p>
            <p style={{ color: '#606060', fontSize: 11 }}>в процессе</p>
            {summary.notListed > 0 && (
              <>
                <p style={{ color: '#606060', fontSize: 14, fontWeight: 600, marginTop: 8 }}>{summary.notListed}</p>
                <p style={{ color: '#606060', fontSize: 11 }}>не сдаётся</p>
              </>
            )}
          </div>
          <div style={{ background: '#1A1A1A', borderRadius: 14, padding: '14px' }}>
            <p style={{ color: '#606060', fontSize: 11, marginBottom: 6 }}>Я арендую</p>
            <p style={{ color: '#5B8AF0', fontSize: 18, fontWeight: 700 }}>{renterBookings.length}</p>
            <p style={{ color: '#606060', fontSize: 11 }}>активных заявок</p>
            <Link href="/bookings" style={{
              display: 'inline-block', marginTop: 12,
              color: '#7B5CF0', fontSize: 12, fontWeight: 600,
            }}>
              Все аренды →
            </Link>
          </div>
        </div>
      </div>

      {/* Я арендую */}
      {renterBookings.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Я арендую
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {renterBookings.map(booking => {
              const badge = getBookingStatusBadge(booking.status)
              const item = booking.item
              return (
                <Link
                  key={booking.id}
                  href="/bookings"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#1A1A1A', borderRadius: 12, padding: '12px',
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#222', overflow: 'hidden', flexShrink: 0 }}>
                    {item?.image_urls?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item?.title || 'Объявление'}
                    </p>
                    <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>
                      {formatBookingDates(booking.start_date, booking.end_date)}
                      {' · '}{booking.total_amount.toLocaleString('ru-RU')} ₽
                    </p>
                    <p style={{ color: '#A0A0A0', fontSize: 11, marginTop: 2 }}>
                      Владелец: {booking.owner?.name || 'Пользователь'}
                    </p>
                  </div>
                  <StatusBadge label={badge.label} color={badge.color} bg={badge.bg} />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Мои объявления — enhanced */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Я сдаю</h2>
          <Link href="/create" style={{
            color: '#7B5CF0', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            + Добавить
          </Link>
        </div>

        {myItems.length === 0 ? (
          <div style={{
            background: '#1A1A1A', borderRadius: 14,
            padding: '24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
            <p style={{ color: '#606060', fontSize: 14 }}>Нет объявлений</p>
            <Link href="/create" className="btn-primary" style={{ marginTop: 12, width: 'auto', padding: '10px 20px', display: 'inline-flex' }}>
              Сдать вещь
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myItems.map((item, index) => {
              const statusInfo = itemStatuses[index]
              const reject = item.reject_reason
              const rowContent = (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#222', overflow: 'hidden', flexShrink: 0 }}>
                    {item.image_urls?.[0]
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <p style={{ color: '#7B5CF0', fontSize: 13, marginTop: 2 }}>
                      {item.price_per_day.toLocaleString('ru-RU')} ₽/день
                    </p>
                    {statusInfo.activeBooking && (
                      <p style={{ color: '#606060', fontSize: 11, marginTop: 4 }}>
                        {formatBookingDates(statusInfo.activeBooking.start_date, statusInfo.activeBooking.end_date)}
                        {' · '}{statusInfo.activeBooking.counterparty}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      <StatusBadge
                        label={statusInfo.listingLabel}
                        color={statusInfo.listingColor}
                        bg={statusInfo.listingBg}
                      />
                      <StatusBadge
                        label={statusInfo.rentLabel}
                        color={statusInfo.rentColor}
                        bg={statusInfo.rentBg}
                      />
                    </div>
                  </div>
                </>
              )

              return (
                <div key={item.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1A1A1A', borderRadius: 12, padding: '12px' }}>
                    {item.status === 'published' ? (
                      <Link href={`/items/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        {rowContent}
                      </Link>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                        {rowContent}
                      </div>
                    )}
                    <Link
                      href={`/items/${item.id}/edit`}
                      style={{
                        flexShrink: 0, padding: '8px 12px', borderRadius: 10,
                        background: 'rgba(123,92,240,0.15)', border: '1px solid rgba(123,92,240,0.3)',
                        color: '#7B5CF0', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      ✏️
                    </Link>
                  </div>
                  {item.status === 'archived' && reject && (
                    <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '0 0 12px 12px', padding: '8px 12px', marginTop: -4 }}>
                      <p style={{ color: '#FF4D4D', fontSize: 12 }}>✉️ Причина: {reject}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
