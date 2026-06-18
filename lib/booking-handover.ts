import type { BookingStatus } from '@/lib/types'

export type HandoverBooking = {
  id: string
  status: BookingStatus
  total_amount: number
  deposit_amount: number | null
  renter_pickup_confirmed_at: string | null
  owner_handover_confirmed_at: string | null
  pickup_rejected_at: string | null
  pickup_reject_reason: string | null
  payment_captured_at: string | null
  payment_status: string | null
}

export function isHandoverComplete(booking: Pick<HandoverBooking, 'renter_pickup_confirmed_at' | 'owner_handover_confirmed_at'>) {
  return !!(booking.renter_pickup_confirmed_at && booking.owner_handover_confirmed_at)
}

export function buildPaymentCapturePayload(now = new Date().toISOString()) {
  return {
    status: 'active' as BookingStatus,
    payment_captured_at: now,
    payment_status: 'captured',
  }
}

export function buildPickupRejectPayload(reason: string, now = new Date().toISOString()) {
  return {
    status: 'cancelled' as BookingStatus,
    pickup_rejected_at: now,
    pickup_reject_reason: reason.trim().slice(0, 500),
  }
}
