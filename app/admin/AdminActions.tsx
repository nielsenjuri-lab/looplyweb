'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminActions({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: 'published' | 'archived') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').update({ status }).eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => updateStatus('published')}
        disabled={loading}
        style={{
          flex: 1, padding: '12px', borderRadius: 12,
          background: 'rgba(76,175,80,0.15)',
          border: '1px solid rgba(76,175,80,0.3)',
          color: '#4CAF50', fontWeight: 600, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        ✓ Опубликовать
      </button>
      <button
        onClick={() => updateStatus('archived')}
        disabled={loading}
        style={{
          flex: 1, padding: '12px', borderRadius: 12,
          background: 'rgba(255,77,77,0.12)',
          border: '1px solid rgba(255,77,77,0.2)',
          color: '#FF4D4D', fontWeight: 600, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        ✕ Отклонить
      </button>
    </div>
  )
}
