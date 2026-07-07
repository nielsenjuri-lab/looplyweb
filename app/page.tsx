import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, SPB_DISTRICTS } from '@/lib/types'
import type { Item } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import ItemCard from '@/components/ItemCard'
import CatalogFilters from '@/components/CatalogFilters'
import Link from 'next/link'
import { getOwnerRatings, attachOwnerRatings } from '@/lib/ratings'

export const revalidate = 0

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; district?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('items')
    .select('*, owner:profiles(id, name, avatar_url, rating, review_count, is_verified)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(40)

  if (params.category) {
    query = query.eq('category_id', params.category)
  }
  if (params.district) {
    query = query.eq('district', params.district)
  }

  const { data: rawItems } = await query
  const itemsList = (rawItems as Item[]) || []

  const { data: publishedCategories } = await supabase
    .from('items')
    .select('category_id')
    .eq('status', 'published')

  const categoryIdsWithItems = new Set((publishedCategories || []).map(r => r.category_id))
  const visibleCategories = CATEGORIES.filter(c => categoryIdsWithItems.has(c.id))

  const ownerIds = [...new Set(itemsList.map((i) => i.owner_id))]
  const ratings = await getOwnerRatings(supabase, ownerIds)
  const items = attachOwnerRatings(itemsList, ratings)

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        padding: '16px 16px 12px',
        position: 'sticky',
        top: 0,
        background: 'rgba(244,237,227,0.95)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        borderBottom: '1px solid #E5DDD5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#FF6B4A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12c-2.5-3-6-3-6 0s3.5 3 6 0zm0 0c2.5 3 6 3 6 0s-3.5-3-6 0z"
                    stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#2B2A28' }}>
                looply
              </span>
            </div>
            <p style={{ color: '#8C8A86', fontSize: 11, marginTop: 4, marginLeft: 40 }}>
              Аренда вещей у соседей
            </p>
          </div>
          <Link href="/profile" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#FFFFFF', border: '1px solid #E5DDD5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#8C8A86" strokeWidth="1.5"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#8C8A86" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>

        {/* Search bar */}
        <Link href="/search" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#FFFFFF', borderRadius: 14, padding: '12px 14px',
          border: '1px solid #E5DDD5',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="#B5AFA9" strokeWidth="1.5"/>
            <path d="M16.5 16.5L21 21" stroke="#B5AFA9" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: '#B5AFA9', fontSize: 15 }}>Что ищете?</span>
        </Link>
      </header>

      {/* Filters */}
      <CatalogFilters
        categories={visibleCategories}
        districts={SPB_DISTRICTS}
        activeCategory={params.category}
        activeDistrict={params.district}
      />

      {/* Items grid */}
      <div style={{ padding: '0 12px' }}>
        {!items || items.length === 0 ? (
          <EmptyState hasFilters={!!(params.category || params.district)} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '60px 24px', gap: 12, textAlign: 'center',
    }}>
      <span style={{ fontSize: 48 }}>📦</span>
      <p style={{ color: '#2B2A28', fontWeight: 600, fontSize: 17 }}>
        {hasFilters ? 'Ничего не найдено' : 'Пока нет объявлений'}
      </p>
      <p style={{ color: '#8C8A86', fontSize: 14, lineHeight: 1.5 }}>
        {hasFilters
          ? 'Попробуйте изменить фильтры'
          : 'Будьте первым — разместите объявление'}
      </p>
      {!hasFilters && (
        <Link href="/create" className="btn-primary" style={{ marginTop: 12, width: 'auto', padding: '12px 24px' }}>
          Сдать вещь
        </Link>
      )}
    </div>
  )
}
