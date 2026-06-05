'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, SPB_DISTRICTS } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AvailabilityCalendar, { type AvailableSlot } from '@/components/AvailabilityCalendar'

export default function CreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    district: '',
    price_per_day: '',
    deposit: '',
    rules: '',
    pickup_hours: '',
    pickup_note: '',
  })

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setPhotos(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth')
      return
    }

    try {
      // Upload photos
      const imageUrls: string[] = []
      for (const photo of photos) {
        const ext = photo.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(path, photo, { contentType: photo.type })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('items').getPublicUrl(path)
        imageUrls.push(data.publicUrl)
      }

      const { data, error } = await supabase.from('items').insert({
        owner_id: user.id,
        title: form.title,
        description: form.description,
        category_id: form.category_id,
        district: form.district,
        price_per_day: parseFloat(form.price_per_day),
        deposit: form.deposit ? parseFloat(form.deposit) : null,
        rules: form.rules || null,
        pickup_hours: form.pickup_hours || null,
        pickup_note: form.pickup_note || null,
        status: 'moderation',
        image_urls: imageUrls,
      }).select('id').single()

      if (error) throw error

      // Save available slots
      if (data && availableSlots.length > 0) {
        await supabase.from('item_available_dates').insert(
          availableSlots.map(s => ({ item_id: data.id, date: s.date, time_from: s.time_from, time_to: s.time_to }))
        )
      }

      router.push('/profile')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка при создании')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      <header style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Новое объявление</h1>
        <p style={{ color: '#606060', fontSize: 13, marginTop: 4 }}>Расскажите о вашей вещи</p>
      </header>

      <form onSubmit={handleSubmit} style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Photo upload */}
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', marginBottom: 8, fontWeight: 500 }}>
            Фотографии (до 5 штук)
          </label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Previews */}
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{
                  width: 80, height: 80, borderRadius: 12,
                  objectFit: 'cover', border: '1px solid #2A2A2A',
                }} />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#FF4D4D', color: '#fff',
                    fontSize: 14, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >×</button>
              </div>
            ))}

            {/* Add button */}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: 12,
                  border: '2px dashed #2A2A2A',
                  background: '#1A1A1A',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 4, color: '#606060', fontSize: 11,
                }}
              >
                <span style={{ fontSize: 24 }}>+</span>
                <span>Фото</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            style={{ display: 'none' }}
          />
        </div>

        <Field label="Название *">
          <input
            placeholder="Например: Камера Sony A7 III"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />
        </Field>

        <Field label="Категория *">
          <select value={form.category_id} onChange={(e) => update('category_id', e.target.value)} required>
            <option value="">Выберите категорию</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Район Петербурга *">
          <select value={form.district} onChange={(e) => update('district', e.target.value)} required>
            <option value="">Выберите район</option>
            {SPB_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        <Field label="Описание">
          <textarea
            placeholder="Состояние, особенности, что входит в комплект..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Цена за день (₽) *">
            <input
              type="number"
              placeholder="500"
              min="1"
              value={form.price_per_day}
              onChange={(e) => update('price_per_day', e.target.value)}
              required
            />
          </Field>
          <Field label="Депозит (₽)">
            <input
              type="number"
              placeholder="2000"
              min="0"
              value={form.deposit}
              onChange={(e) => update('deposit', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Правила аренды">
          <textarea
            placeholder="Что нельзя делать, как обращаться..."
            value={form.rules}
            onChange={(e) => update('rules', e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </Field>

        <Field label="📍 Место самовывоза">
          <textarea
            placeholder="Например: метро Невский пр., договариваемся в чате. Прошу не звонить после 21:00."
            value={form.pickup_note}
            onChange={(e) => update('pickup_note', e.target.value)}
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </Field>

        {/* Availability calendar */}
        <div>
          <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', marginBottom: 8, fontWeight: 500 }}>
            📅 Когда готовы передать вещь
          </label>
          <p style={{ color: '#606060', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            Выберите дни когда сможете встретиться с арендатором и задайте время. Арендатор сможет бронировать только эти дни.
          </p>
          <AvailabilityCalendar
            value={availableSlots}
            onChange={setAvailableSlots}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,77,77,0.12)',
            border: '1px solid rgba(255,77,77,0.3)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#FF4D4D',
          }}>
            {error}
          </div>
        )}

        <div style={{
          background: 'rgba(123,92,240,0.1)',
          border: '1px solid rgba(123,92,240,0.2)',
          borderRadius: 12, padding: '12px 14px',
          fontSize: 13, color: '#A0A0A0', lineHeight: 1.5,
        }}>
          💡 После создания объявление пройдёт модерацию (обычно 24 часа) и станет видно всем.
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Создаём...' : 'Опубликовать объявление'}
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
