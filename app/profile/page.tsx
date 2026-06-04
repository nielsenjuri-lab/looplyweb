import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import SignOutButton from '@/components/SignOutButton'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: myItems } = await supabase
    .from('items')
    .select('id, title, price_per_day, status, image_urls')
    .eq('owner_id', user.id)
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
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Trust Score', value: profile?.trust_score ?? 50, emoji: '🛡️' },
            { label: 'Рейтинг', value: profile?.rating ? Number(profile.rating).toFixed(1) : '—', emoji: '⭐' },
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
              {myItems.map((item) => (
                <Link key={item.id} href={`/items/${item.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#1A1A1A', borderRadius: 12, padding: '12px',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: '#222', overflow: 'hidden', flexShrink: 0,
                  }}>
                    {item.image_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
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
                    padding: '3px 8px', borderRadius: 20, fontSize: 11,
                    background: item.status === 'published' ? 'rgba(76,175,80,0.15)' : 'rgba(255,183,0,0.15)',
                    color: item.status === 'published' ? '#4CAF50' : '#FFB700',
                  }}>
                    {item.status === 'published' ? 'Активно' : item.status === 'moderation' ? 'Модерация' : item.status}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <SignOutButton />
      </div>

      <BottomNav />
    </div>
  )
}
