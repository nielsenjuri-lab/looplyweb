'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Сбрасывает протухшую сессию, чтобы не зацикливать ошибку refresh token */
export default function AuthSessionRecovery() {
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ error }) => {
      if (
        error &&
        (error.message.includes('Refresh Token') || error.message.includes('Session Expired'))
      ) {
        supabase.auth.signOut({ scope: 'local' })
      }
    })
  }, [])

  return null
}
