'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'moderation' | 'published'

export default function AdminActions({ itemId, mode = 'moderation' }: { itemId: string; mode?: Mode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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

  async function unpublish() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').update({ status: 'moderation' }).eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  async function reject() {
    if (!showRejectForm) {
      setShowRejectForm(true)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').update({
      status: 'archived',
      reject_reason: rejectReason || null,
      admin_note: adminNote || null,
    }).eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  async function deleteItem() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('items').delete().eq('id', itemId)
    router.refresh()
    setLoading(false)
  }

  if (mode === 'published') {
    return (
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <button
          onClick={unpublish}
          disabled={loading}
          style={{
            flex: 1, padding: '9px', borderRadius: 10,
            background: 'rgba(255,183,0,0.12)',
            border: '1px solid rgba(255,183,0,0.25)',
            color: '#FFB700', fontWeight: 600, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          ↩ Снять с публикации
        </button>
        <button
          onClick={deleteItem}
          disabled={loading}
          style={{
            flex: 1, padding: '9px', borderRadius: 10,
            background: confirmDelete ? 'rgba(255,77,77,0.3)' : 'rgba(255,77,77,0.1)',
            border: '1px solid rgba(255,77,77,0.3)',
            color: '#FF4D4D', fontWeight: 600, fontSize: 13,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {confirmDelete ? '⚠️ Точно удалить?' : '🗑 Удалить'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Admin note */}
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

      {/* Reject reason */}
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
