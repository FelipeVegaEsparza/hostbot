'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default function LocaleHomePage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(`/${locale}/dashboard`)
    } else {
      router.push(`/${locale}/login`)
    }
  }, [router, locale])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirigiendo...</p>
    </div>
  )
}
