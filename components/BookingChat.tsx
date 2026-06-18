'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import type { Message, BookingStatus } from '@/lib/types'
import { CHAT_WRITABLE_STATUSES } from '@/lib/booking-access'

type Props = {
  bookingId: string
  bookingStatus: BookingStatus
  currentUserId: string
  otherPersonName: string
  itemTitle: string
  open: boolean
  onClose: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BookingChat({
  bookingId,
  bookingStatus,
  currentUserId,
  otherPersonName,
  itemTitle,
  open,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)
  const canWrite = CHAT_WRITABLE_STATUSES.includes(bookingStatus)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function loadMessages() {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('id, booking_id, sender_id, text, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      const msg = fetchError.message || ''
      if (
        fetchError.code === '42P01' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('public.messages')
      ) {
        setError(
          'Таблица messages не создана. Откройте Supabase → SQL Editor → вставьте код из docs/messages.sql → Run.'
        )
      } else {
        setError(msg)
      }
      return
    }
    setMessages((data as Message[]) || [])
    setError('')
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    loadMessages().finally(() => setLoading(false))

    const supabase = createClient()
    const channel = supabase
      .channel(`booking-chat-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    const poll = setInterval(loadMessages, 5000)

    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [open, bookingId])

  useEffect(() => {
    if (!open || !messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, open])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !canWrite) return

    setSending(true)
    setError('')
    const supabase = createClient()
    const { data, error: sendError } = await supabase
      .from('messages')
      .insert({ booking_id: bookingId, sender_id: currentUserId, text: trimmed })
      .select('id, booking_id, sender_id, text, created_at')
      .single()

    if (sendError) {
      const msg = sendError.message || ''
      if (msg.includes('schema cache') || msg.includes('public.messages')) {
        setError('Сначала создайте таблицу: Supabase → SQL Editor → docs/messages.sql')
      } else {
        setError(msg)
      }
    } else if (data) {
      setMessages(prev => [...prev, data as Message])
      setText('')
    }
    setSending(false)
  }

  if (!open || !mounted) return null

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9998, backdropFilter: 'blur(3px)',
        }}
      />

      <div
        role="dialog"
        aria-label="Чат по бронированию"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          margin: '0 auto',
          width: '100%',
          maxWidth: 480,
          height: 'min(85dvh, 640px)',
          background: '#111',
          borderTop: '1px solid #2A2A2A',
          borderRadius: '20px 20px 0 0',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#333' }} />
        </div>

        <div style={{
          padding: '8px 16px 12px',
          borderBottom: '1px solid #1A1A1A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>💬 Чат</p>
            <p style={{ color: '#A0A0A0', fontSize: 12, marginTop: 2 }}>
              {otherPersonName} · {itemTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: 8, padding: '8px 12px', color: '#A0A0A0', cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div
          ref={messagesRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {loading && messages.length === 0 && (
            <p style={{ color: '#A0A0A0', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
              Загрузка...
            </p>
          )}

          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 12px', margin: 'auto 0' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>👋</p>
              <p style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                Бронь подтверждена
              </p>
              <p style={{ color: '#A0A0A0', fontSize: 13, lineHeight: 1.55 }}>
                Договоритесь о времени и месте встречи.
                <br />
                Контакты — на странице объявления.
              </p>
            </div>
          )}

          {messages.map(msg => {
            const mine = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                <div style={{
                  background: mine ? 'rgba(123,92,240,0.3)' : '#1A1A1A',
                  border: mine ? '1px solid rgba(123,92,240,0.4)' : '1px solid #2A2A2A',
                  borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 12px',
                }}>
                  <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </p>
                </div>
                <p style={{
                  color: '#606060', fontSize: 10, marginTop: 4,
                  textAlign: mine ? 'right' : 'left',
                }}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            )
          })}
        </div>

        {error && (
          <p style={{
            color: '#FF8A8A', fontSize: 12, padding: '0 16px 8px',
            flexShrink: 0, lineHeight: 1.4,
          }}>
            ⚠️ {error}
          </p>
        )}

        {canWrite ? (
          <form
            onSubmit={handleSend}
            style={{
              padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
              borderTop: '1px solid #1A1A1A',
              display: 'flex', gap: 8, alignItems: 'center',
              flexShrink: 0, background: '#111',
            }}
          >
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Сообщение..."
              maxLength={2000}
              style={{
                flex: 1, minWidth: 0, padding: '12px 14px', fontSize: 14,
                background: '#1A1A1A', border: '1px solid #2A2A2A',
                borderRadius: 12, color: '#fff',
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              style={{
                flexShrink: 0,
                width: 48, height: 48,
                background: '#7B5CF0',
                color: '#fff',
                borderRadius: 12,
                fontSize: 18, fontWeight: 700,
                opacity: !text.trim() || sending ? 0.5 : 1,
                cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
              }}
            >
              ↑
            </button>
          </form>
        ) : (
          <div style={{
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
            borderTop: '1px solid #1A1A1A', color: '#606060', fontSize: 12, textAlign: 'center',
            flexShrink: 0, background: '#111',
          }}>
            Чат закрыт — аренда завершена
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
