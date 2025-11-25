'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const authenticated = isAuthenticated()
    setIsAuth(authenticated)
    
    if (!authenticated) {
      router.push('/login')
    }
  }, [router])

  // Don't render anything until we're on the client
  if (!isClient) {
    return null
  }

  // Don't render dashboard if not authenticated
  if (!isAuth) {
    return null
  }

  return (
    <div className="flex h-screen">
      <DashboardNav />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
