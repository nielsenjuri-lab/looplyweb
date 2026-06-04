'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

type Props = {
  categories: { id: string; name: string; icon: string }[]
  districts: string[]
  activeCategory?: string
  activeDistrict?: string
}

export default function CatalogFilters({ categories, districts, activeCategory, activeDistrict }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div style={{ padding: '12px 0 4px' }}>
      {/* Categories */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '0 12px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <button
          onClick={() => updateFilter('category', null)}
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            background: !activeCategory ? '#7B5CF0' : '#1A1A1A',
            color: !activeCategory ? '#fff' : '#A0A0A0',
            border: `1px solid ${!activeCategory ? '#7B5CF0' : '#2A2A2A'}`,
            transition: 'all 0.2s',
          }}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateFilter('category', activeCategory === cat.id ? null : cat.id)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              background: activeCategory === cat.id ? '#7B5CF0' : '#1A1A1A',
              color: activeCategory === cat.id ? '#fff' : '#A0A0A0',
              border: `1px solid ${activeCategory === cat.id ? '#7B5CF0' : '#2A2A2A'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* District filter */}
      <div style={{ padding: '10px 12px 0' }}>
        <select
          value={activeDistrict || ''}
          onChange={(e) => updateFilter('district', e.target.value || null)}
          style={{
            background: '#1A1A1A',
            border: `1px solid ${activeDistrict ? '#7B5CF0' : '#2A2A2A'}`,
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            color: activeDistrict ? '#fff' : '#606060',
            width: '100%',
          }}
        >
          <option value="">📍 Все районы Санкт-Петербурга</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
