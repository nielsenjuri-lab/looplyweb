import type { BookingStatus } from '@/lib/types'

/**
 * Пока есть бронь в этих статусах, цену и депозит объявления менять нельзя —
 * сумма уже зафиксирована в booking.total_amount / deposit_amount.
 * Новая цена действует только с следующей аренды (после завершения текущих).
 */
export const PRICE_LOCKED_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'active']

export function isPriceLockedByBookings(activeBookingCount: number): boolean {
  return activeBookingCount > 0
}
