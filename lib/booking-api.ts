import type { SupabaseClient } from '@supabase/supabase-js'

export type BookingAction = 'owner_confirm' | 'owner_reject' | 'renter_cancel' | 'owner_complete'

export async function createBookingRequest(
  supabase: SupabaseClient,
  itemId: string,
  startDate: string,
  endDate: string,
) {
  return supabase.rpc('create_booking_request', {
    p_item_id: itemId,
    p_start_date: startDate,
    p_end_date: endDate,
  })
}

export async function bookingStatusAction(
  supabase: SupabaseClient,
  bookingId: string,
  action: BookingAction,
) {
  return supabase.rpc('booking_status_action', {
    p_booking_id: bookingId,
    p_action: action,
  })
}

export async function handoverConfirmPickup(supabase: SupabaseClient, bookingId: string) {
  return supabase.rpc('handover_confirm_pickup', { p_booking_id: bookingId })
}

export async function handoverRejectPickup(
  supabase: SupabaseClient,
  bookingId: string,
  reason: string,
) {
  return supabase.rpc('handover_reject_pickup', {
    p_booking_id: bookingId,
    p_reason: reason,
  })
}

export async function getOwnerPhoneForBooking(supabase: SupabaseClient, bookingId: string) {
  return supabase.rpc('get_owner_phone_for_booking', { p_booking_id: bookingId })
}
