import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditItemForm from './EditItemForm'
import { PRICE_LOCKED_BOOKING_STATUSES } from '@/lib/item-pricing'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: item } = await supabase
    .from('items')
    .select('id, title, description, category_id, district, price_per_day, deposit, rules, pickup_hours, pickup_note, status, owner_id')
    .eq('id', id)
    .single()

  if (!item) notFound()
  if (item.owner_id !== user.id) redirect('/')

  const { count: activeBookingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', id)
    .in('status', PRICE_LOCKED_BOOKING_STATUSES)

  return (
    <EditItemForm
      item={item}
      priceLocked={(activeBookingCount ?? 0) > 0}
    />
  )
}
