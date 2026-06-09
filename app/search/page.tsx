import { createClient } from '@/lib/supabase/server'
import type { Item } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import ItemCard from '@/components/ItemCard'
import BackButton from '@/components/BackButton'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let items: Item[] = []

  if (q && q.trim().length > 0) {
    const { data } = await supabase
      .from('items')
      .select('*, owner:profiles(id, name, avatar_url, rating, review_count, is_verified)')
      .eq('status', 'published')
      .ilike('title', `%${q}%`)
      .limit(40)

    items = (data as Item[]) || []
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{
        padding: '16px',
        position: 'sticky', top: 0,
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        borderBottom: '1px solid #1A1A1A',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BackButton />
          <form action="/search" style={{ flex: 1 }}>
            <input
              name="q"
              defaultValue={q}
              placeholder="Камера, дрон, велосипед..."
              autoFocus
              style={{ margin: 0 }}
            />
          </form>
        </div>
      </div>

      <div style={{ padding: '16px 12px' }}>
        {q && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#606060' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p>По запросу «{q}» ничего не найдено</p>
          </div>
        )}
        {!q && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#606060' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
            <p>Введите запрос для поиска</p>
          </div>
        )}
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
