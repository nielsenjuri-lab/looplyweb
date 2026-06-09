type Props = {
  rating: number
  reviewCount: number
  size?: 'sm' | 'md'
}

export default function RatingBadge({ rating, reviewCount, size = 'sm' }: Props) {
  if (!reviewCount || reviewCount < 1) return null

  const isMd = size === 'md'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(13,13,13,0.85)',
      backdropFilter: 'blur(8px)',
      borderRadius: isMd ? 10 : 8,
      padding: isMd ? '6px 10px' : '4px 8px',
      fontSize: isMd ? 13 : 11,
      fontWeight: 600,
      color: '#fff',
      lineHeight: 1,
    }}>
      <span style={{ color: '#FFB800' }}>★</span>
      <span>{Number(rating).toFixed(1)}</span>
      <span style={{ color: '#A0A0A0', fontWeight: 400 }}>({reviewCount})</span>
    </div>
  )
}
