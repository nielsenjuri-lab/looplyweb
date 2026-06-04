import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Ожидает',    color: '#FFB700', bg: 'rgba(255,183,0,0.12)' },
  confirmed: { label: 'Подтверждено', color: '#5B8AF0', bg: 'rgba(91,138,240,0.12)' },
  active:    { label: 'Активна',    color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' },
  completed: { label: 'Завершена',  color: '#606060', bg: 'rgba(96,96,96,0.12)' },
  cancelled: { label: 'Отменена',   color: '#FF4D4D', bg: 'rgba(255,77,77,0.12)' },
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, item:items(id, title, image_urls, price_per_day)')
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ paddingBottom: 80 }}>
      <header style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Мои аренды</h1>
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

      <div style={{ padding: '16px' }}>
        {!bookings || bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 6 }}>Нет аренд</p>
            <p style={{ color: '#606060', fontSize: 14 }}>Найдите что-нибудь в каталоге</p>
            <Link href="/" className="btn-primary" style={{ marginTop: 20, width: 'auto', padding: '12px 24px', display: 'inline-flex' }}>
              Открыть каталог
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map((booking) => {
              const status = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
              const item = booking.item as { id: string; title: string; image_urls: string[]; price_per_day: number }
              return (
                <div key={booking.id} style={{
                  background: '#1A1A1A', borderRadius: 16, overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', gap: 12, padding: '14px' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 12,
                      background: '#222', overflow: 'hidden', flexShrink: 0,
                    }}>
                      {item?.image_urls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#fff', fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                        {item?.title || 'Объявление'}
                      </p>
                      <p style={{ color: '#606060', fontSize: 12 }}>
                        {new Date(booking.start_date).toLocaleDateString('ru-RU')} —{' '}
                        {new Date(booking.end_date).toLocaleDateString('ru-RU')}
                      </p>
                      <p style={{ color: '#7B5CF0', fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                        {booking.total_amount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 20, height: 'fit-content',
                      background: status.bg, color: status.color, fontSize: 11, fontWeight: 600,
                    }}>
                      {status.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
