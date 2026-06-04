import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Item } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import BackButton from '@/components/BackButton'
import BookingWidget from '@/components/BookingWidget'

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: item } = await supabase
    .from('items')
    .select('*, owner:profiles(id, name, avatar_url, rating, review_count, is_verified, district)')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!item) notFound()

  const typedItem = item as Item

  const { data: unavailableRows } = await supabase
    .from('item_unavailable_dates')
    .select('date')
    .eq('item_id', id)

  const unavailableDates = (unavailableRows || []).map((r: { date: string }) => r.date)

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Images */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: '100%',
          aspectRatio: '4/3',
          background: '#1A1A1A',
          overflow: 'hidden',
        }}>
          {typedItem.image_urls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typedItem.image_urls[0]}
              alt={typedItem.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              📦
            </div>
          )}
        </div>

        {/* Back button */}
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <BackButton />
        </div>

        {/* Image count */}
        {typedItem.image_urls?.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 10px', fontSize: 12, color: '#fff',
          }}>
            1 / {typedItem.image_urls.length}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 16px' }}>
        {/* Title & price */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3, flex: 1 }}>
              {typedItem.title}
            </h1>
            {typedItem.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ color: '#FFB800' }}>★</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{Number(typedItem.rating).toFixed(1)}</span>
                <span style={{ color: '#606060', fontSize: 12 }}>({typedItem.review_count})</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#7B5CF0' }}>
              {typedItem.price_per_day.toLocaleString('ru-RU')} ₽
            </span>
            <span style={{ color: '#606060', fontSize: 14 }}>/ день</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#606060"/>
            </svg>
            <span style={{ color: '#606060', fontSize: 13 }}>{typedItem.district}</span>
          </div>
        </div>

        {/* Deposit */}
        {typedItem.deposit && (
          <div style={{
            background: '#1A1A1A',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                Депозит {typedItem.deposit.toLocaleString('ru-RU')} ₽
              </p>
              <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>
                Возвращается после возврата вещи
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {typedItem.description && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Описание</h2>
            <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.6 }}>
              {typedItem.description}
            </p>
          </div>
        )}

        {/* Rules */}
        {typedItem.rules && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Правила</h2>
            <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.6 }}>
              {typedItem.rules}
            </p>
          </div>
        )}

        {/* Owner */}
        {typedItem.owner && (
          <div style={{
            background: '#1A1A1A',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7B5CF0, #5B8AF0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {typedItem.owner.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={typedItem.owner.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                  {typedItem.owner.name || 'Пользователь'}
                </span>
                {typedItem.owner.is_verified && (
                  <span style={{ color: '#7B5CF0', fontSize: 12 }}>✓ Верифицирован</span>
                )}
              </div>
              {typedItem.owner.review_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ color: '#FFB800', fontSize: 12 }}>★</span>
                  <span style={{ color: '#A0A0A0', fontSize: 12 }}>
                    {Number(typedItem.owner.rating).toFixed(1)} · {typedItem.owner.review_count} отзывов
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pickup note */}
      {typedItem.pickup_note && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ background: '#1A1A1A', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10 }}>
            <span>📍</span>
            <p style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 1.5 }}>{typedItem.pickup_note}</p>
          </div>
        </div>
      )}

      {/* Booking widget */}
      <BookingWidget item={typedItem} unavailableDates={unavailableDates} currentUserId={user?.id ?? null} />
      <BottomNav />
    </div>
  )
}
