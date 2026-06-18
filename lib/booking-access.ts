import type { BookingStatus } from '@/lib/types'

/** Статусы брони, при которых арендатор видит телефон и адрес встречи */
export const CONTACT_VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'active']

/** Статусы, при которых доступен чат (отправка — только confirmed/active) */
export const CHAT_VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'active', 'completed']
export const CHAT_WRITABLE_STATUSES: BookingStatus[] = ['confirmed', 'active']

export function canSeeContactInfo(
  bookingStatus: BookingStatus | null,
  userId: string | null,
  ownerId: string
): boolean {
  if (!userId) return false
  if (userId === ownerId) return true
  if (!bookingStatus) return false
  return CONTACT_VISIBLE_STATUSES.includes(bookingStatus)
}
