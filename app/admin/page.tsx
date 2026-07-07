import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminActions from './AdminActions'

// Only this user ID can access admin panel
const ADMIN_USER_ID = 'fabb7245-b2f7-47bb-a0a7-aee2651388f5'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')
  if (user.id !== ADMIN_USER_ID) redirect('/')

  const { data: pending } = await supabase
    .from('items')
    .select('*, owner:profiles(id, name)')
    .eq('status', 'moderation')
    .order('created_at', { ascending: true })

  const { data: published } = await supabase
    .from('items')
    .select('id, title, status, created_at, owner:profiles(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2A28', marginBottom: 4 }}>
        Модерация
      </h1>
      <p style={{ color: '#8C8A86', fontSize: 13, marginBottom: 24 }}>
        {pending?.length ?? 0} ожидают проверки
      </p>

      {/* Pending */}
      {pending && pending.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          {pending.map((item) => (
            <div key={item.id} style={{
              background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
              border: '1px solid #E5DDD5',
            }}>
              {/* Image */}
              {item.image_urls?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_urls[0]}
                  alt=""
                  style={{ width: '100%', height: 200, objectFit: 'cover' }}
                />
              )}

              <div style={{ padding: '14px 16px' }}>
                <p style={{ color: '#2B2A28', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {item.title}
                </p>
                <p style={{ color: '#8C8A86', fontSize: 13, marginBottom: 8 }}>
                  от {(item.owner as { name: string })?.name || 'Пользователь'} · {item.district} · {item.price_per_day} ₽/день
                </p>
                {item.description && (
                  <p style={{ color: '#8C8A86', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                    {item.description}
                  </p>
                )}
                {item.image_urls?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {item.image_urls.map((url: string, i: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" style={{
                        width: 56, height: 56, borderRadius: 8, objectFit: 'cover',
                        border: '1px solid #E5DDD5',
                      }} />
                    ))}
                  </div>
                )}
                <AdminActions itemId={item.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#FAF7F4', borderRadius: 14, padding: '32px',
          textAlign: 'center', marginBottom: 32, border: '1px solid #E5DDD5',
        }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
          <p style={{ color: '#8C8A86' }}>Нет объявлений на модерации</p>
        </div>
      )}

      {/* Published items — full management */}
      {published && published.length > 0 && (
        <div>
          <h2 style={{ color: '#B5AFA9', fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Опубликованные объявления
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {published.map((item) => (
              <div key={item.id} style={{
                background: '#FFFFFF', borderRadius: 14,
                border: '1px solid #E5DDD5', overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#2B2A28', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <p style={{ color: '#8C8A86', fontSize: 12, marginTop: 2 }}>
                      от {(item.owner as unknown as { name: string })?.name || 'Пользователь'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, color: '#4CAF50', flexShrink: 0,
                    background: 'rgba(76,175,80,0.12)',
                    padding: '3px 8px', borderRadius: 20,
                  }}>
                    Активно
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #E5DDD5', padding: '10px 14px', display: 'flex', gap: 8 }}>
                  <AdminActions itemId={item.id} mode="published" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
