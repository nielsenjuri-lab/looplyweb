'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminActions({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function publish() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').update({
      status: 'published',
      admin_note: adminNote || null,
    }).eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  async function reject() {
    if (!rejectReason.trim()) {
      setShowRejectForm(true)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').update({
      status: 'archived',
      reject_reason: rejectReason,
      admin_note: adminNote || null,
    }).eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Admin note (internal) */}
      <div>
        <label style={{ fontSize: 11, color: '#606060', display: 'block', marginBottom: 4 }}>
          📝 Заметка для себя (не видна пользователю)
        </label>
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Например: повторная публикация, подозрительное фото..."
          rows={2}
          style={{ fontSize: 13, padding: '8px 12px', resize: 'none' }}
        />
      </div>

      {/* Reject reason (visible to user) */}
      {showRejectForm && (
        <div>
          <label style={{ fontSize: 11, color: '#FF4D4D', display: 'block', marginBottom: 4 }}>
            ✉️ Причина отклонения (придёт пользователю)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Например: фото не соответствует описанию, укажите реальную цену..."
            rows={3}
            autoFocus
            style={{ fontSize: 13, padding: '8px 12px', resize: 'none', borderColor: 'rgba(255,77,77,0.4)' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={publish}
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
          onClick={reject}
          disabled={loading}
          style={{
            flex: 1, padding: '12px', borderRadius: 12,
            background: showRejectForm ? 'rgba(255,77,77,0.25)' : 'rgba(255,77,77,0.12)',
            border: '1px solid rgba(255,77,77,0.3)',
            color: '#FF4D4D', fontWeight: 600, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {showRejectForm ? '✕ Подтвердить отказ' : '✕ Отклонить'}
        </button>
      </div>
    </div>
  )
}
