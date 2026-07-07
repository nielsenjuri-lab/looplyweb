import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import OwnerAvailabilityEditor from './OwnerAvailabilityEditor'
import BackButton from '@/components/BackButton'
import { expandBookingDates } from '@/lib/booking-dates'

export default async function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: item } = await supabase
    .from('items')
    .select('id, title, owner_id, pickup_note, status')
    .eq('id', id)
    .single()

  if (!item) notFound()
  if (item.owner_id !== user.id) redirect('/')

  const [{ data: slots }, { data: bookings }] = await Promise.all([
    supabase
      .from('item_available_dates')
      .select('date, time_from, time_to')
      .eq('item_id', id)
      .order('date'),
    supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('item_id', id)
      .in('status', ['pending', 'confirmed', 'active']),
  ])

  const initialSlots = (slots || []).map(s => ({
    date: s.date,
    time_from: String(s.time_from).slice(0, 5),
    time_to: String(s.time_to).slice(0, 5),
  }))

  const bookedDates = expandBookingDates(bookings || [])

  return (
    <div style={{ paddingBottom: 40 }}>
      <header style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #E5DDD5', position: 'sticky', top: 0,
        background: 'rgba(244,237,227,0.95)', backdropFilter: 'blur(20px)', zIndex: 50,
      }}>
        <BackButton />
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#2B2A28' }}>Доступность</h1>
          <p style={{ fontSize: 12, color: '#8C8A86', marginTop: 1 }}>{item.title}</p>
        </div>
      </header>

      <OwnerAvailabilityEditor
        itemId={id}
        itemStatus={item.status}
        pickupNote={item.pickup_note || ''}
        initialSlots={initialSlots}
        bookedDates={bookedDates}
      />
    </div>
  )
}
