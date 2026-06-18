import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import SignOutButton from '@/components/SignOutButton'
import RatingBadge from '@/components/RatingBadge'
import ReviewList from '@/components/ReviewList'
import ProfileRentalsOverview from '@/components/ProfileRentalsOverview'
import Link from 'next/link'

const ADMIN_USER_ID = 'fabb7245-b2f7-47bb-a0a7-aee2651388f5'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const isAdmin = user.id === ADMIN_USER_ID

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myItems } = await supabase
    .from('items')
    .select('id, title, price_per_day, status, image_urls, reject_reason')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const [{ data: ownerBookings }, { data: renterBookings }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, item_id, status, start_date, end_date, renter:profiles!renter_id(name)')
      .eq('owner_id', user.id)
      .in('status', ['pending', 'confirmed', 'active']),
    supabase
      .from('bookings')
      .select('id, status, start_date, end_date, total_amount, item:items(id, title, image_urls), owner:profiles!owner_id(name)')
      .eq('renter_id', user.id)
      .in('status', ['pending', 'confirmed', 'active'])
      .order('created_at', { ascending: false }),
  ])

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(id, name)')
    .eq('reviewee_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ paddingBottom: 80 }}>
      <header style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #1A1A1A',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Профиль</h1>
      </header>

      <div style={{ padding: '20px 16px' }}>
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#1A1A1A', borderRadius: 16, padding: '16px',
          marginBottom: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B5CF0, #5B8AF0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            👤
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
              {profile?.name || 'Пользователь'}
            </p>
            <p style={{ color: '#606060', fontSize: 13, marginTop: 2 }}>{user.email}</p>
            {profile?.district && (
              <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>📍 {profile.district}</p>
            )}
            <div style={{ marginTop: 8 }}>
              {profile?.review_count ? (
                <RatingBadge rating={profile.rating} reviewCount={profile.review_count} size="md" />
              ) : (
                <span style={{ color: '#606060', fontSize: 13 }}>Пока нет отзывов</span>
              )}
            </div>
          </div>
        </div>

        {/* Admin button */}
        {isAdmin && (
          <Link href="/admin" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(123,92,240,0.1)',
            border: '1px solid rgba(123,92,240,0.3)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>🛡️</span>
              <div>
                <p style={{ color: '#7B5CF0', fontWeight: 600, fontSize: 14 }}>Панель модерации</p>
                <p style={{ color: '#606060', fontSize: 12 }}>Проверить новые объявления</p>
              </div>
            </div>
            <span style={{ color: '#7B5CF0' }}>→</span>
          </Link>
        )}

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Trust Score', value: profile?.trust_score ?? 50, emoji: '🛡️' },
            { label: 'Рейтинг', value: profile?.review_count ? Number(profile.rating).toFixed(1) : '—', emoji: '⭐' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#1A1A1A', borderRadius: 14,
              padding: '14px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 22, marginBottom: 4 }}>{stat.emoji}</p>
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{stat.value}</p>
              <p style={{ color: '#606060', fontSize: 12 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <ProfileRentalsOverview
          myItems={(myItems || []) as {
            id: string
            title: string
            price_per_day: number
            status: 'draft' | 'moderation' | 'published' | 'archived'
            image_urls: string[]
            reject_reason?: string | null
          }[]}
          ownerBookings={(ownerBookings || []).map(b => ({
            ...b,
            renter: b.renter as unknown as { name: string } | null,
          }))}
          renterBookings={(renterBookings || []).map(b => ({
            ...b,
            item: b.item as unknown as { id: string; title: string; image_urls: string[] } | null,
            owner: b.owner as unknown as { name: string } | null,
          }))}
        />

        {/* Reviews */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Отзывы {profile?.review_count ? `(${profile.review_count})` : ''}
          </h2>
          <ReviewList reviews={(reviews || []).map((r) => ({
            ...r,
            reviewer: r.reviewer as unknown as { id: string; name: string } | null,
          }))} />
        </div>

        <SignOutButton />
      </div>

      <BottomNav />
    </div>
  )
}
