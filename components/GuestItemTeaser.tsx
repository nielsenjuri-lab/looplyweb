import Link from 'next/link'
import RatingBadge from '@/components/RatingBadge'
import type { Profile } from '@/lib/types'

const PREVIEW_LENGTH = 60

type Props = {
  description: string | null
  owner: Pick<Profile, 'id' | 'name' | 'avatar_url' | 'rating' | 'review_count' | 'is_verified'> | undefined
}

export default function GuestItemTeaser({ description, owner }: Props) {
  const text = description?.trim() || ''
  const hasMore = text.length > PREVIEW_LENGTH
  const preview = hasMore ? `${text.slice(0, PREVIEW_LENGTH).trim()}…` : text

  return (
    <>
      {text && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Описание</h2>
          <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.6 }}>
            {preview}
            {hasMore && (
              <>
                {' '}
                <Link
                  href="/auth"
                  style={{ color: '#7B5CF0', fontWeight: 600, textDecoration: 'none' }}
                >
                  ещё
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      {owner && (
        <div style={{
          background: '#1A1A1A',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B5CF0, #5B8AF0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {owner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : '👤'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
                {owner.name || 'Пользователь'}
              </span>
              {owner.is_verified && (
                <span style={{ color: '#7B5CF0', fontSize: 12 }}>✓ Верифицирован</span>
              )}
            </div>
            {owner.review_count > 0 ? (
              <div style={{ marginTop: 4, pointerEvents: 'none', userSelect: 'none' }}>
                <RatingBadge rating={owner.rating} reviewCount={owner.review_count} />
              </div>
            ) : (
              <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>Новый пользователь</p>
            )}
            {owner.review_count > 0 && (
              <p style={{ color: '#606060', fontSize: 11, marginTop: 6 }}>
                Отзывы — после{' '}
                <Link href="/auth" style={{ color: '#7B5CF0', fontWeight: 500, textDecoration: 'none' }}>
                  регистрации
                </Link>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
