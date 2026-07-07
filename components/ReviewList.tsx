import type { Review } from '@/lib/types'

type ReviewRow = Pick<Review, 'id' | 'rating' | 'comment' | 'created_at'> & {
  reviewer?: { id: string; name: string } | null
}

export default function ReviewList({ reviews }: { reviews: ReviewRow[] }) {
  if (!reviews.length) {
    return (
      <div style={{
        background: '#FAF7F4', borderRadius: 12, padding: '20px',
        textAlign: 'center', color: '#8C8A86', fontSize: 14,
      }}>
        Пока нет отзывов
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reviews.map((review) => (
        <div key={review.id} style={{
          background: '#FFFFFF', borderRadius: 12, padding: '12px 14px', border: '1px solid #E5DDD5',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ color: '#2B2A28', fontSize: 13, fontWeight: 500 }}>
              {review.reviewer?.name || 'Пользователь'}
            </span>
            <span style={{ color: '#FFB800', fontSize: 13, letterSpacing: 1 }}>
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
          </div>
          {review.comment && (
            <p style={{ color: '#8C8A86', fontSize: 13, lineHeight: 1.5 }}>{review.comment}</p>
          )}
          <p style={{ color: '#B5AFA9', fontSize: 11, marginTop: review.comment ? 6 : 0 }}>
            {new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  )
}
