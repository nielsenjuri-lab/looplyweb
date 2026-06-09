import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import BookingsTabs from '@/components/BookingsTabs'
import type { BookingStatus } from '@/lib/types'

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const [{ data: asRenter }, { data: asOwner }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, item:items(id, title, image_urls, price_per_day), owner:profiles!owner_id(id, name, avatar_url, rating, review_count)')
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('*, item:items(id, title, image_urls, price_per_day), renter:profiles!renter_id(id, name, avatar_url, rating, review_count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const renterRows = (asRenter || []).map((b) => ({
    id: b.id,
    status: b.status as BookingStatus,
    start_date: b.start_date,
    end_date: b.end_date,
    total_amount: b.total_amount,
    item: b.item as { id: string; title: string; image_urls: string[]; price_per_day: number } | null,
    person: b.owner as { id: string; name: string; avatar_url: string | null; rating?: number; review_count?: number } | null,
    personLabel: 'Владелец',
    role: 'renter' as const,
  }))

  const ownerRows = (asOwner || []).map((b) => ({
    id: b.id,
    status: b.status as BookingStatus,
    start_date: b.start_date,
    end_date: b.end_date,
    total_amount: b.total_amount,
    item: b.item as { id: string; title: string; image_urls: string[]; price_per_day: number } | null,
    person: b.renter as { id: string; name: string; avatar_url: string | null; rating?: number; review_count?: number } | null,
    personLabel: 'Арендатор',
    role: 'owner' as const,
  }))

  const hasIncoming = ownerRows.some(b => b.status === 'pending')

  return (
    <div style={{ paddingBottom: 80 }}>
      <header style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Аренды</h1>
        <p style={{ color: '#606060', fontSize: 13, marginTop: 4 }}>
          Ваши заявки и запросы на ваши вещи
        </p>
      </header>

      {success && (
        <div style={{
          margin: '16px 16px 0',
          background: 'rgba(76,175,80,0.12)',
          border: '1px solid rgba(76,175,80,0.3)',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>✅</span>
          <p style={{ color: '#4CAF50', fontSize: 14 }}>
            Заявка отправлена! Ждите подтверждения от владельца.
          </p>
        </div>
      )}

      <BookingsTabs
        asRenter={renterRows}
        asOwner={ownerRows}
        initialTab={hasIncoming ? 'owner' : 'renter'}
      />

      <BottomNav />
    </div>
  )
}
