export type Category = {
  id: string
  name: string
  icon: string
  sort: number
}

export type Profile = {
  id: string
  name: string
  avatar_url: string | null
  phone: string | null
  district: string | null
  trust_score: number
  rating: number
  review_count: number
  is_verified: boolean
}

export type Item = {
  id: string
  owner_id: string
  category_id: string
  title: string
  description: string
  price_per_day: number
  deposit: number | null
  district: string
  rules: string | null
  pickup_hours: string | null
  pickup_note: string | null
  image_urls: string[]
  status: 'draft' | 'moderation' | 'published' | 'archived'
  rating: number
  review_count: number
  created_at: string
  owner?: Profile
}

export type Booking = {
  id: string
  item_id: string
  renter_id: string
  owner_id: string
  start_date: string
  end_date: string
  total_amount: number
  deposit_amount: number | null
  status: BookingStatus
  created_at: string
  item?: Item
  renter?: Profile
  owner?: Profile
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'

export type Message = {
  id: string
  booking_id: string
  sender_id: string
  text: string
  created_at: string
}

export type Review = {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Pick<Profile, 'id' | 'name' | 'avatar_url'>
}

export const SPB_DISTRICTS = [
  'Адмиралтейский',
  'Василеостровский',
  'Выборгский',
  'Калининский',
  'Кировский',
  'Колпинский',
  'Красногвардейский',
  'Красносельский',
  'Кронштадтский',
  'Курортный',
  'Московский',
  'Невский',
  'Петроградский',
  'Петродворцовый',
  'Приморский',
  'Пушкинский',
  'Фрунзенский',
  'Центральный',
]

export const CATEGORIES = [
  { id: 'cameras', name: 'Камеры', icon: '📷' },
  { id: 'gaming', name: 'Консоли', icon: '🎮' },
  { id: 'projectors', name: 'Проекторы', icon: '📽️' },
  { id: 'drones', name: 'Дроны', icon: '🚁' },
  { id: 'dj', name: 'DJ', icon: '🎧' },
  { id: 'tools', name: 'Инструменты', icon: '🔧' },
  { id: 'bikes', name: 'Велосипеды', icon: '🚲' },
  { id: 'camping', name: 'Кемпинг', icon: '⛺' },
]
