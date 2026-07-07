import { createClient } from '@/lib/supabase/server'

import { notFound } from 'next/navigation'

import type { BookingStatus, Item } from '@/lib/types'

import Link from 'next/link'

import BottomNav from '@/components/BottomNav'

import BackButton from '@/components/BackButton'

import BookingWidget from '@/components/BookingWidget'

import RatingBadge from '@/components/RatingBadge'

import GuestItemTeaser from '@/components/GuestItemTeaser'

import ContactReveal from '@/components/ContactReveal'

import { getOwnerRatings } from '@/lib/ratings'

import { expandBookingDates } from '@/lib/booking-dates'

import { canSeeContactInfo } from '@/lib/booking-access'
import { getOwnerPhoneForBooking } from '@/lib/booking-api'



export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params

  const supabase = await createClient()



  const { data: { user } } = await supabase.auth.getUser()

  const isLoggedIn = !!user



  const { data: item } = await supabase

    .from('items')

    .select('*, owner:profiles(id, name, avatar_url, rating, review_count, is_verified, district)')

    .eq('id', id)

    .eq('status', 'published')

    .single()



  if (!item) notFound()



  const typedItem = item as Item

  const isOwner = user?.id === typedItem.owner_id



  const ownerRatings = await getOwnerRatings(supabase, [typedItem.owner_id])

  const ownerStats = ownerRatings.get(typedItem.owner_id)

  if (ownerStats && typedItem.owner) {

    typedItem.owner = { ...typedItem.owner, ...ownerStats }

  }



  let userBookingStatus: BookingStatus | null = null

  let userBookingId: string | null = null

  if (user && !isOwner) {

    const { data: userBooking } = await supabase

      .from('bookings')

      .select('id, status')

      .eq('item_id', id)

      .eq('renter_id', user.id)

      .in('status', ['pending', 'confirmed', 'active'])

      .order('created_at', { ascending: false })

      .limit(1)

      .maybeSingle()



    userBookingStatus = (userBooking?.status as BookingStatus) ?? null

    userBookingId = userBooking?.id ?? null

  }



  const hasContactAccess = canSeeContactInfo(userBookingStatus, user?.id ?? null, typedItem.owner_id)



  let ownerPhone: string | null = null

  if (hasContactAccess && userBookingId) {
    const { data: phone } = await getOwnerPhoneForBooking(supabase, userBookingId)
    ownerPhone = phone ?? null
  } else if (hasContactAccess && isOwner) {
    const { data: ownerContact } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', typedItem.owner_id)
      .single()
    ownerPhone = ownerContact?.phone ?? null
  }



  const [{ data: availableSlots }, { data: bookings }] = await Promise.all([

    supabase.from('item_available_dates').select('date, time_from, time_to').eq('item_id', id),

    supabase.from('bookings').select('start_date, end_date').eq('item_id', id).in('status', ['confirmed', 'active', 'pending']),

  ])



  const bookedDates = expandBookingDates(bookings || [])



  return (

    <div>

      {/* Images */}

      <div style={{ position: 'relative' }}>

        <div style={{

          width: '100%',

          aspectRatio: '4/3',

          background: '#EFE8E0',

          overflow: 'hidden',

        }}>

          {typedItem.image_urls?.[0] ? (

            // eslint-disable-next-line @next/next/no-img-element

            <img

              src={typedItem.image_urls[0]}

              alt={typedItem.title}

              style={{ width: '100%', height: '100%', objectFit: 'cover' }}

            />

          ) : (

            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>

              📦

            </div>

          )}

        </div>



        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>

          <BackButton />

        </div>



        {typedItem.owner && typedItem.owner.review_count > 0 && (

          <div style={{
            position: 'absolute', top: 16, right: 16, zIndex: 2,
            pointerEvents: isLoggedIn ? 'auto' : 'none',
            userSelect: isLoggedIn ? 'auto' : 'none',
          }}>

            <RatingBadge

              rating={typedItem.owner.rating}

              reviewCount={typedItem.owner.review_count}

              size="md"

            />

          </div>

        )}



        {typedItem.image_urls?.length > 1 && isLoggedIn && (

          <div style={{

            position: 'absolute', bottom: 12, right: 12,

            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',

            borderRadius: 20, padding: '4px 10px', fontSize: 12, color: '#fff',

          }}>

            1 / {typedItem.image_urls.length}

          </div>

        )}

      </div>



      <div style={{ padding: '20px 16px' }}>

        {/* Title & price — видны всем */}

        <div style={{ marginBottom: 16 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>

            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3, flex: 1 }}>

              {typedItem.title}

            </h1>

          </div>



          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>

            <span style={{ fontSize: 24, fontWeight: 700, color: '#FF6B4A' }}>

              {typedItem.price_per_day.toLocaleString('ru-RU')} ₽

            </span>

            <span style={{ color: '#606060', fontSize: 14 }}>/ день</span>

          </div>



          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>

            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">

              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#606060"/>

            </svg>

            <span style={{ color: '#606060', fontSize: 13 }}>{typedItem.district}</span>

          </div>

        </div>



        {/* Гость — только цена и район, остальное за входом */}

        {!isLoggedIn && (
          <GuestItemTeaser
            description={typedItem.description}
            owner={typedItem.owner}
          />
        )}



        {/* Авторизованным — полное описание (без контактов) */}

        {isLoggedIn && (

          <>

            {typedItem.deposit != null && typedItem.deposit > 0 && (

              <div style={{

                background: '#FAF7F4',

                borderRadius: 12,

                padding: '12px 14px',

                marginBottom: 16,

                display: 'flex',

                alignItems: 'center',

                gap: 10,

              }}>

                <span style={{ fontSize: 20 }}>🔒</span>

                <div>

                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>

                    Депозит {typedItem.deposit.toLocaleString('ru-RU')} ₽

                  </p>

                  <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>

                    Возвращается после возврата вещи

                  </p>

                </div>

              </div>

            )}



            {typedItem.description && (

              <div style={{ marginBottom: 20 }}>

                <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Описание</h2>

                <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.6 }}>

                  {typedItem.description}

                </p>

              </div>

            )}



            {typedItem.rules && (

              <div style={{ marginBottom: 20 }}>

                <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Правила</h2>

                <p style={{ color: '#A0A0A0', fontSize: 14, lineHeight: 1.6 }}>

                  {typedItem.rules}

                </p>

              </div>

            )}



            <ContactReveal

              isLoggedIn={isLoggedIn}

              hasContactAccess={hasContactAccess}

              bookingStatus={userBookingStatus}

              bookingId={hasContactAccess ? userBookingId : null}

              phone={ownerPhone}

              pickupNote={hasContactAccess ? typedItem.pickup_note : null}

              pickupHours={hasContactAccess ? typedItem.pickup_hours : null}

              isOwner={isOwner}

            />



            {typedItem.owner && (

              <Link href={`/users/${typedItem.owner.id}`} style={{

                background: '#FAF7F4',

                borderRadius: 14,

                padding: '14px 16px',

                display: 'flex',

                alignItems: 'center',

                gap: 12,

              }}>

                <div style={{

                  width: 44, height: 44, borderRadius: '50%',

                  background: '#FF6B4A',

                  display: 'flex', alignItems: 'center', justifyContent: 'center',

                  fontSize: 18, flexShrink: 0,

                }}>

                  {typedItem.owner.avatar_url ? (

                    // eslint-disable-next-line @next/next/no-img-element

                    <img src={typedItem.owner.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />

                  ) : '👤'}

                </div>

                <div style={{ flex: 1 }}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>

                      {typedItem.owner.name || 'Пользователь'}

                    </span>

                    {typedItem.owner.is_verified && (

                      <span style={{ color: '#8FA79A', fontSize: 12 }}>✓ Верифицирован</span>

                    )}

                  </div>

                  {typedItem.owner.review_count > 0 ? (

                    <div style={{ marginTop: 4 }}>

                      <RatingBadge

                        rating={typedItem.owner.rating}

                        reviewCount={typedItem.owner.review_count}

                      />

                    </div>

                  ) : (

                    <p style={{ color: '#606060', fontSize: 12, marginTop: 2 }}>Новый пользователь</p>

                  )}

                </div>

                <span style={{ color: '#606060', fontSize: 18 }}>›</span>

              </Link>

            )}

          </>

        )}

      </div>



      <BookingWidget

        item={typedItem}

        currentUserId={user?.id ?? null}

        initialSlots={availableSlots || []}

        initialBookedDates={bookedDates}

      />

      <BottomNav />

    </div>

  )

}


