import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import SignOutButton from '@/components/SignOutButton'
import RatingBadge from '@/components/RatingBadge'
import ReviewList from '@/components/ReviewList'
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

        {/* My listings */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Мои объявления</h2>
            <Link href="/create" style={{
              color: '#7B5CF0', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              + Добавить
            </Link>
          </div>

          {!myItems || myItems.length === 0 ? (
            <div style={{
              background: '#1A1A1A', borderRadius: 14,
              padding: '24px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📦</p>
              <p style={{ color: '#606060', fontSize: 14 }}>Нет объявлений</p>
              <Link href="/create" className="btn-primary" style={{ marginTop: 12, width: 'auto', padding: '10px 20px', display: 'inline-flex' }}>
                Сдать вещь
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myItems.map((item) => {
                const reject = (item as typeof item & { reject_reason?: string | null }).reject_reason
                const rowContent = (
                  <>
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: '#222', overflow: 'hidden', flexShrink: 0 }}>
                      {item.image_urls?.[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </p>
                      <p style={{ color: '#7B5CF0', fontSize: 13, marginTop: 2 }}>
                        {item.price_per_day.toLocaleString('ru-RU')} ₽/день
                      </p>
                    </div>
                    <div style={{
                      padding: '3px 8px', borderRadius: 20, fontSize: 11, flexShrink: 0,
                      background: item.status === 'published' ? 'rgba(76,175,80,0.15)' : item.status === 'archived' ? 'rgba(255,77,77,0.12)' : 'rgba(255,183,0,0.15)',
                      color: item.status === 'published' ? '#4CAF50' : item.status === 'archived' ? '#FF4D4D' : '#FFB700',
                    }}>
                      {item.status === 'published' ? 'Активно' : item.status === 'moderation' ? 'На проверке' : 'Отклонено'}
                    </div>
                  </>
                )
                return (
                  <div key={item.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1A1A1A', borderRadius: 12, padding: '12px' }}>
                      {item.status === 'published' ? (
                        <Link href={`/items/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          {rowContent}
                        </Link>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          {rowContent}
                        </div>
                      )}
                      <Link
                        href={`/items/${item.id}/edit`}
                        style={{
                          flexShrink: 0, padding: '8px 12px', borderRadius: 10,
                          background: 'rgba(123,92,240,0.15)', border: '1px solid rgba(123,92,240,0.3)',
                          color: '#7B5CF0', fontSize: 12, fontWeight: 600,
                        }}
                      >
                        ✏️
                      </Link>
                    </div>
                    {item.status === 'archived' && reject && (
                      <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)', borderRadius: '0 0 12px 12px', padding: '8px 12px', marginTop: -4 }}>
                        <p style={{ color: '#FF4D4D', fontSize: 12 }}>✉️ Причина: {reject}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <SignOutButton />
      </div>

      <BottomNav />
    </div>
  )
}
