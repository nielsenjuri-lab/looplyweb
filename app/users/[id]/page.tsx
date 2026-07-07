import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import BackButton from '@/components/BackButton'
import RatingBadge from '@/components/RatingBadge'
import ReviewList from '@/components/ReviewList'
import ItemCard from '@/components/ItemCard'
import type { Item } from '@/lib/types'
import { getOwnerRatings, attachOwnerRatings } from '@/lib/ratings'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, district, rating, review_count, is_verified')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const ownerRatings = await getOwnerRatings(supabase, [id])
  const profileStats = ownerRatings.get(id)
  const displayProfile = profileStats
    ? { ...profile, rating: profileStats.rating, review_count: profileStats.review_count }
    : profile

  const [{ data: reviews }, { data: rawItems }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(id, name)')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('items')
      .select('*, owner:profiles(id, name, avatar_url, rating, review_count, is_verified)')
      .eq('owner_id', id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(12),
  ])

  const items = attachOwnerRatings((rawItems as Item[]) || [], ownerRatings)

  const reviewRows = (reviews || []).map((r) => ({
    ...r,
    reviewer: r.reviewer as unknown as { id: string; name: string } | null,
  }))

  return (
    <div style={{ paddingBottom: 80 }}>
      <header style={{
        padding: '16px', borderBottom: '1px solid #E5DDD5',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <BackButton />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#2B2A28' }}>Профиль</h1>
      </header>

      <div style={{ padding: '20px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: '#FFFFFF', borderRadius: 16, padding: '16px', border: '1px solid #E5DDD5',
          marginBottom: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#FF6B4A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0, overflow: 'hidden',
          }}>
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '👤'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ color: '#2B2A28', fontWeight: 700, fontSize: 18 }}>
                {displayProfile.name || 'Пользователь'}
              </p>
              {profile.is_verified && (
                <span style={{ color: '#8FA79A', fontSize: 12 }}>✓ Верифицирован</span>
              )}
            </div>
            {displayProfile.district && (
              <p style={{ color: '#8C8A86', fontSize: 13, marginTop: 4 }}>📍 {displayProfile.district}</p>
            )}
            <div style={{ marginTop: 8 }}>
              {displayProfile.review_count > 0 ? (
                <RatingBadge rating={displayProfile.rating} reviewCount={displayProfile.review_count} size="md" />
              ) : (
                <span style={{ color: '#8C8A86', fontSize: 13 }}>Новый пользователь</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#2B2A28', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
            Отзывы {displayProfile.review_count > 0 && `(${displayProfile.review_count})`}
          </h2>
          <ReviewList reviews={reviewRows} />
        </div>

        {items && items.length > 0 && (
          <div>
            <h2 style={{ color: '#2B2A28', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
              Объявления
            </h2>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
