'use client'

import Link from 'next/link'
import type { Item } from '@/lib/types'

export default function ItemCard({ item }: { item: Item }) {
  const image = item.image_urls?.[0]

  return (
    <Link href={`/items/${item.id}`} style={{ display: 'block' }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Image */}
        <div style={{
          aspectRatio: '1/1',
          background: '#1A1A1A',
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

          {/* District badge */}
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(13,13,13,0.8)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 11,
            color: '#A0A0A0',
          }}>
            {item.district}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{
            fontSize: 13,
            color: '#fff',
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
            <span style={{ fontSize: 15, fontWeight: 700, color: '#7B5CF0' }}>
              {item.price_per_day.toLocaleString('ru-RU')} ₽/день
            </span>

            {item.review_count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 11, color: '#FFB800' }}>★</span>
                <span style={{ fontSize: 12, color: '#A0A0A0' }}>
                  {Number(item.rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
