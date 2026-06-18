'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, SPB_DISTRICTS } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import BackButton from '@/components/BackButton'
import { moderationFieldsAfterEdit, moderationNotice } from '@/lib/item-moderation'

type ItemData = {
  id: string
  title: string
  description: string
  category_id: string
  district: string
  price_per_day: number
  deposit: number | null
  rules: string | null
  pickup_hours: string | null
  pickup_note: string | null
  status: string
}

export default function EditItemForm({
  item,
  priceLocked,
}: {
  item: ItemData
  priceLocked: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: item.title,
    description: item.description || '',
    category_id: item.category_id,
    district: item.district,
    price_per_day: String(item.price_per_day),
    deposit: item.deposit != null ? String(item.deposit) : '',
    rules: item.rules || '',
    pickup_hours: item.pickup_hours || '',
    pickup_note: item.pickup_note || '',
  })

  function update(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      category_id: form.category_id,
      district: form.district,
      rules: form.rules.trim() || null,
      pickup_hours: form.pickup_hours.trim() || null,
      pickup_note: form.pickup_note.trim() || null,
    }

    if (!priceLocked) {
      payload.price_per_day = parseFloat(form.price_per_day)
      payload.deposit = form.deposit ? parseFloat(form.deposit) : null
    }

    Object.assign(payload, moderationFieldsAfterEdit(item.status))

    const { error: updateError } = await supabase
      .from('items')
      .update(payload)
      .eq('id', item.id)
      .eq('owner_id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => router.push('/profile'), 800)
    }
    setLoading(false)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1A1A1A', position: 'sticky', top: 0,
        background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(20px)', zIndex: 50,
      }}>
        <BackButton />
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Редактировать</h1>
          <p style={{ fontSize: 12, color: '#606060', marginTop: 1 }}>{item.title}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Название *">
          <input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            required
          />
        </Field>

        <Field label="Категория *">
          <select value={form.category_id} onChange={e => update('category_id', e.target.value)} required>
            <option value="">Выберите категорию</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Район *">
          <select value={form.district} onChange={e => update('district', e.target.value)} required>
            <option value="">Выберите район</option>
            {SPB_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        <Field label="Описание *">
          <textarea
            placeholder="Состояние, особенности, что входит в комплект..."
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={6}
            required
            style={{ resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Цена/день (₽) *">
            <input
              type="number"
              min="1"
              value={form.price_per_day}
              onChange={e => update('price_per_day', e.target.value)}
              required
              disabled={priceLocked}
              style={priceLocked ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            />
          </Field>
          <Field label="Депозит (₽)">
            <input
              type="number"
              min="0"
              value={form.deposit}
              onChange={e => update('deposit', e.target.value)}
              disabled={priceLocked}
              style={priceLocked ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
            />
          </Field>
        </div>

        {priceLocked && (
          <div style={{
            background: 'rgba(255,183,0,0.1)', border: '1px solid rgba(255,183,0,0.25)',
            borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#FFB700', lineHeight: 1.5,
          }}>
            🔒 Цена и депозит заблокированы — есть активная или подтверждённая аренда.
            Изменить их можно после завершения текущих броней; новая сумма будет действовать только для следующих арендаторов.
          </div>
        )}

        <Field label="Правила аренды">
          <textarea
            value={form.rules}
            onChange={e => update('rules', e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </Field>

        <Field label="Время самовывоза">
          <input
            placeholder="Например: 18:00 — 21:00"
            value={form.pickup_hours}
            onChange={e => update('pickup_hours', e.target.value)}
          />
        </Field>

        <Field label="Место самовывоза">
          <textarea
            placeholder="Метро, ориентир, комментарий..."
            value={form.pickup_note}
            onChange={e => update('pickup_note', e.target.value)}
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </Field>

        {moderationNotice(item.status) && (
          <div style={{
            background: 'rgba(255,183,0,0.1)', border: '1px solid rgba(255,183,0,0.25)',
            borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#FFB700', lineHeight: 1.5,
          }}>
            {moderationNotice(item.status)}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.3)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF4D4D',
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4CAF50',
          }}>
            ✓ {item.status === 'published' ? 'Отправлено на проверку' : 'Изменения сохранены'}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
