'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  bookingId: string
  revieweeId: string
  revieweeName: string
}

export default function ReviewForm({ bookingId, revieweeId, revieweeName }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (rating < 1) {
      setError('Поставьте оценку от 1 до 5')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    })

    if (insertError) {
      setError(insertError.message.includes('unique')
        ? 'Вы уже оставили отзыв по этой аренде'
        : insertError.message)
      setLoading(false)
      return
    }

    setDone(true)
    router.refresh()
    setLoading(false)
  }

  if (done) {
    return (
      <div style={{
        padding: '10px 14px', margin: '0 14px 14px',
        background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.25)',
        borderRadius: 10, fontSize: 13, color: '#4CAF50',
      }}>
        ✓ Отзыв отправлен
      </div>
    )
  }

  const display = hover || rating

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <p style={{ color: '#A0A0A0', fontSize: 12, marginBottom: 8 }}>
        Оцените {revieweeName}
      </p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: 'none', border: 'none', padding: 2,
              fontSize: 28, cursor: 'pointer', lineHeight: 1,
              color: star <= display ? '#FFB800' : '#333',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        placeholder="Комментарий (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        style={{
          width: '100%', marginBottom: 10, resize: 'vertical',
          fontSize: 13, padding: '10px 12px',
        }}
      />

      {error && <p style={{ color: '#FF4D4D', fontSize: 12, marginBottom: 8 }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading || rating < 1}
        className="btn-primary"
        style={{ padding: '10px', fontSize: 13 }}
      >
        {loading ? 'Отправляем...' : 'Оставить отзыв'}
      </button>
    </div>
  )
}
