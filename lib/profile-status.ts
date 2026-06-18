import type { BookingStatus } from '@/lib/types'

export type ItemListingStatus = 'draft' | 'moderation' | 'published' | 'archived'

export type ItemRentState =
  | 'not_listed'
  | 'available'
  | 'pending'
  | 'confirmed'
  | 'rented'

export type ProfileItemStatus = {
  rentState: ItemRentState
  rentLabel: string
  rentColor: string
  rentBg: string
  listingLabel: string
  listingColor: string
  listingBg: string
  activeBooking: {
    id: string
    status: BookingStatus
    start_date: string
    end_date: string
    counterparty: string
  } | null
}

const LISTING_LABELS: Record<ItemListingStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Черновик', color: '#606060', bg: 'rgba(96,96,96,0.15)' },
  moderation: { label: 'На проверке', color: '#FFB700', bg: 'rgba(255,183,0,0.15)' },
  published: { label: 'На сайте', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  archived: { label: 'Снято', color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)' },
}

const RENT_LABELS: Record<ItemRentState, { label: string; color: string; bg: string }> = {
  not_listed: { label: 'Не сдаётся', color: '#606060', bg: 'rgba(96,96,96,0.15)' },
  available: { label: 'Свободно', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  pending: { label: 'Есть заявка', color: '#FFB700', bg: 'rgba(255,183,0,0.15)' },
  confirmed: { label: 'Ждёт передачи', color: '#5B8AF0', bg: 'rgba(91,138,240,0.15)' },
  rented: { label: 'В аренде', color: '#7B5CF0', bg: 'rgba(123,92,240,0.18)' },
}

const BOOKING_STATUS_LABELS: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Ожидает ответа', color: '#FFB700', bg: 'rgba(255,183,0,0.15)' },
  confirmed: { label: 'Подтверждено', color: '#5B8AF0', bg: 'rgba(91,138,240,0.15)' },
  active: { label: 'Аренда идёт', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  completed: { label: 'Завершена', color: '#606060', bg: 'rgba(96,96,96,0.15)' },
  cancelled: { label: 'Отменена', color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)' },
}

type BookingRow = {
  id: string
  item_id: string
  status: BookingStatus
  start_date: string
  end_date: string
  renter?: { name: string } | null
}

const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'active']

function pickPrimaryBooking(bookings: BookingRow[]) {
  const order: BookingStatus[] = ['active', 'confirmed', 'pending']
  for (const status of order) {
    const found = bookings.find(b => b.status === status)
    if (found) return found
  }
  return null
}

export function getProfileItemStatus(
  listingStatus: ItemListingStatus,
  bookings: BookingRow[],
): ProfileItemStatus {
  const listing = LISTING_LABELS[listingStatus]
  const activeBookings = bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status))
  const primary = pickPrimaryBooking(activeBookings)

  if (listingStatus !== 'published') {
    const rent = RENT_LABELS.not_listed
    return {
      rentState: 'not_listed',
      rentLabel: rent.label,
      rentColor: rent.color,
      rentBg: rent.bg,
      listingLabel: listing.label,
      listingColor: listing.color,
      listingBg: listing.bg,
      activeBooking: null,
    }
  }

  let rentState: ItemRentState = 'available'
  if (activeBookings.some(b => b.status === 'active')) rentState = 'rented'
  else if (activeBookings.some(b => b.status === 'confirmed')) rentState = 'confirmed'
  else if (activeBookings.some(b => b.status === 'pending')) rentState = 'pending'

  const rent = RENT_LABELS[rentState]

  return {
    rentState,
    rentLabel: rent.label,
    rentColor: rent.color,
    rentBg: rent.bg,
    listingLabel: listing.label,
    listingColor: listing.color,
    listingBg: listing.bg,
    activeBooking: primary
      ? {
          id: primary.id,
          status: primary.status,
          start_date: primary.start_date,
          end_date: primary.end_date,
          counterparty: primary.renter?.name || 'Арендатор',
        }
      : null,
  }
}

export function getBookingStatusBadge(status: BookingStatus) {
  return BOOKING_STATUS_LABELS[status] || BOOKING_STATUS_LABELS.pending
}

export function formatBookingDates(start: string, end: string) {
  if (start === end) {
    return new Date(start + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  const s = new Date(start + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const e = new Date(end + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return `${s} — ${e}`
}

export function countOwnerSummary(items: ProfileItemStatus[]) {
  return {
    available: items.filter(i => i.rentState === 'available').length,
    inProgress: items.filter(i => ['pending', 'confirmed', 'rented'].includes(i.rentState)).length,
    notListed: items.filter(i => i.rentState === 'not_listed').length,
  }
}

export { LISTING_LABELS, RENT_LABELS, BOOKING_STATUS_LABELS }
