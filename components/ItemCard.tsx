'use client'

import Link from 'next/link'
import type { Item } from '@/lib/types'
import RatingBadge from '@/components/RatingBadge'

export default function ItemCard({ item }: { item: Item }) {
  const image = item.image_urls?.[0]
  const ownerRating = Number(item.owner?.rating ?? 0)
  const ownerReviewCount = Number(item.owner?.review_count ?? 0)

  return (
    <Link href={`/items/${item.id}`} style={{ display: 'block' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Image */}
        <div style={{
          aspectRatio: '1/1',
          background: '#EFE8E0',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}>
              📦
            </div>
          )}

          {/* Owner rating — top left like Airbnb */}
          {ownerReviewCount > 0 && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <RatingBadge rating={ownerRating} reviewCount={ownerReviewCount} />
            </div>
          )}

          {/* District badge */}
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(43,42,40,0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 11,
            color: '#F4EDE3',
          }}>
            {item.district}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{
            fontSize: 13,
            color: '#2B2A28',
            fontWeight: 500,
            lineHeight: 1.3,
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {item.title}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#FF6B4A' }}>
              {item.price_per_day.toLocaleString('ru-RU')} ₽/день
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
