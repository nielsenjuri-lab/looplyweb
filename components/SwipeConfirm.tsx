'use client'

import { useRef, useState } from 'react'

type Props = {
  label: string
  hint?: string
  color?: string
  disabled?: boolean
  onConfirm: () => void | Promise<void>
  onError?: (message: string) => void
}

export default function SwipeConfirm({
  label,
  hint = 'Смахните вправо →',
  color = '#FF6B4A',
  disabled = false,
  onConfirm,
  onError,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragX, setDragX] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const startX = useRef(0)
  const dragging = useRef(false)

  const maxDrag = 220

  function getMax() {
    if (!trackRef.current) return maxDrag
    return Math.max(trackRef.current.clientWidth - 56, 120)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || loading || done) return
    dragging.current = true
    startX.current = e.clientX - dragX
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || disabled || loading || done) return
    const max = getMax()
    const next = Math.min(Math.max(0, e.clientX - startX.current), max)
    setDragX(next)
  }

  async function onPointerUp() {
    if (!dragging.current || disabled || loading || done) return
    dragging.current = false
    const max = getMax()
    if (dragX >= max * 0.82) {
      setLoading(true)
      setDragX(max)
      try {
        await onConfirm()
        setDone(true)
      } catch (e) {
        setDragX(0)
        const msg = e instanceof Error ? e.message : 'Не удалось сохранить'
        onError?.(msg)
      } finally {
        setLoading(false)
      }
    } else {
      setDragX(0)
    }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.35)',
        borderRadius: 14, padding: '14px', textAlign: 'center',
        color: '#4CAF50', fontWeight: 600, fontSize: 14,
      }}>
        ✓ Подтверждено
      </div>
    )
  }

  return (
    <div>
      <div
        ref={trackRef}
        style={{
          position: 'relative', height: 52, borderRadius: 14,
          background: '#FAF7F4', border: `1px solid ${color}44`,
          overflow: 'hidden', opacity: disabled ? 0.5 : 1,
          touchAction: 'none', userSelect: 'none',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8C8A86', fontSize: 13, fontWeight: 500, pointerEvents: 'none',
        }}>
          {loading ? 'Сохраняем...' : label}
        </div>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'absolute', left: 4, top: 4, bottom: 4, width: 44,
            borderRadius: 12, background: color,
            transform: `translateX(${dragX}px)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, cursor: disabled ? 'not-allowed' : 'grab',
            boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
            transition: dragging.current ? 'none' : 'transform 0.2s ease',
          }}
        >
          »
        </div>
      </div>
      <p style={{ color: '#606060', fontSize: 11, marginTop: 6, textAlign: 'center' }}>{hint}</p>
    </div>
  )
}
