import type { SupabaseClient } from '@supabase/supabase-js'
import type { Item } from '@/lib/types'

export type OwnerRating = { rating: number; review_count: number }

export async function getOwnerRatings(
  supabase: SupabaseClient,
  ownerIds: string[]
): Promise<Map<string, OwnerRating>> {
  const map = new Map<string, OwnerRating>()
  if (!ownerIds.length) return map

  const { data: reviews } = await supabase
    .from('reviews')
    .select('reviewee_id, rating')
    .in('reviewee_id', ownerIds)

  if (!reviews) return map

  const sums = new Map<string, { total: number; count: number }>()
  for (const r of reviews) {
    const cur = sums.get(r.reviewee_id) || { total: 0, count: 0 }
    cur.total += r.rating
    cur.count += 1
    sums.set(r.reviewee_id, cur)
  }

  for (const [id, { total, count }] of sums) {
    map.set(id, {
      rating: Math.round((total / count) * 10) / 10,
      review_count: count,
    })
  }

  return map
}

export function attachOwnerRatings(items: Item[], ratings: Map<string, OwnerRating>): Item[] {
  return items.map((item) => {
    const stats = ratings.get(item.owner_id)
    if (!stats || !item.owner) return item
    return {
      ...item,
      owner: { ...item.owner, rating: stats.rating, review_count: stats.review_count },
    }
  })
}
