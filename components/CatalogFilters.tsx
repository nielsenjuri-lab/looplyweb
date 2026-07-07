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
            background: !activeCategory ? '#FF6B4A' : '#FFFFFF',
            color: !activeCategory ? '#fff' : '#8C8A86',
            border: `1px solid ${!activeCategory ? '#FF6B4A' : '#E5DDD5'}`,
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
              background: activeCategory === cat.id ? '#FF6B4A' : '#FFFFFF',
              color: activeCategory === cat.id ? '#fff' : '#8C8A86',
              border: `1px solid ${activeCategory === cat.id ? '#FF6B4A' : '#E5DDD5'}`,
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
          background: '#FFFFFF',
          border: `1px solid ${activeDistrict ? '#FF6B4A' : '#E5DDD5'}`,
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 13,
          color: activeDistrict ? '#2B2A28' : '#8C8A86',
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
