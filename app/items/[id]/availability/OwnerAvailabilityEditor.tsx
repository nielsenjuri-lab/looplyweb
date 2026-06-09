'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AvailabilityCalendar, { type AvailableSlot } from '@/components/AvailabilityCalendar'

type Props = {
  itemId: string
  pickupNote: string
  initialSlots: AvailableSlot[]
  bookedDates: string[]
}

export default function OwnerAvailabilityEditor({ itemId, pickupNote, initialSlots, bookedDates }: Props) {
  const router = useRouter()
  const [slots, setSlots] = useState<AvailableSlot[]>(initialSlots)
  const [note, setNote] = useState(pickupNote)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: itemError } = await supabase.from('items').update({
      pickup_note: note || null,
    }).eq('id', itemId)

    if (itemError) {
      setError(itemError.message)
      setSaving(false)
      return
    }

    await supabase.from('item_available_dates').delete().eq('item_id', itemId)

    if (slots.length > 0) {
      const { error: slotsError } = await supabase.from('item_available_dates').insert(
        slots.map(s => ({ item_id: itemId, date: s.date, time_from: s.time_from, time_to: s.time_to }))
      )
      if (slotsError) {
        setError(slotsError.message)
        setSaving(false)
        return
      }
    }

    setSaved(true)
    setSaving(false)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', fontWeight: 500, marginBottom: 6 }}>
          📍 Место и условия самовывоза
        </label>
        <textarea
          value={note}
          onChange={(e) => { setNote(e.target.value); setSaved(false) }}
          placeholder="Например: метро Невский пр., договариваемся в чате."
          rows={3}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#A0A0A0', fontWeight: 500, marginBottom: 8 }}>
          📅 Когда готовы передать вещь
        </label>
        <p style={{ color: '#606060', fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
          Зелёные дни — доступны для аренды. Красные — заняты (заявка или аренда на 1+ дней).
        </p>
        <AvailabilityCalendar
          value={slots}
          onChange={setSlots}
          bookedDates={bookedDates}
        />
      </div>

      {error && <p style={{ color: '#FF4D4D', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Сохраняем...' : saved ? '✓ Сохранено!' : 'Сохранить'}
      </button>
    </div>
  )
}
