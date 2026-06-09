import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AvailabilityManager from './AvailabilityManager'
import BackButton from '@/components/BackButton'
import { expandBookingDates } from '@/lib/booking-dates'

export default async function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: item } = await supabase
    .from('items')
    .select('id, title, owner_id, pickup_hours, pickup_note')
    .eq('id', id)
    .single()

  if (!item) notFound()
  if (item.owner_id !== user.id) redirect('/')

  const { data: unavailableRows } = await supabase
    .from('item_unavailable_dates')
    .select('date')
    .eq('item_id', id)

  const unavailableDates = (unavailableRows || []).map((r: { date: string }) => r.date)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_date, end_date, status')
    .eq('item_id', id)
    .in('status', ['pending', 'confirmed', 'active'])

  const bookedDates = expandBookingDates(bookings || [])

  return (
    <div style={{ paddingBottom: 40 }}>
      <header style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1A1A1A', position: 'sticky', top: 0,
        background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(20px)', zIndex: 50,
      }}>
        <BackButton />
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Доступность</h1>
          <p style={{ fontSize: 12, color: '#606060', marginTop: 1 }}>{item.title}</p>
        </div>
      </header>

      <AvailabilityManager
        itemId={id}
        pickupHours={item.pickup_hours || ''}
        pickupNote={item.pickup_note || ''}
        unavailableDates={unavailableDates}
        bookedDates={bookedDates}
      />
    </div>
  )
}
