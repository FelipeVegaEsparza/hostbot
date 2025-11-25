'use client'

import { useRouter, usePathname, useParams } from 'next/navigation'
import { locales, localeNames } from '@/i18n'
import { Globe } from 'lucide-react'
import { useEffect, useState } from 'react'

export function LanguageSelector() {
  const params = useParams()
  const locale = (params.locale as string) || 'es'
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing localStorage
  useEffect(() => {
    setMounted(true)
  }, [])

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return

    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale)
    }
    
    // Update URL - handle both with and without locale prefix
    let newPathname = pathname
    
    // If current locale is in the path, replace it
    if (pathname.startsWith(`/${locale}`)) {
      newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    } else {
      // If no locale in path (default locale), add the new locale prefix
      newPathname = `/${newLocale}${pathname}`
    }
    
    // For default locale (es), remove the prefix
    if (newLocale === 'es') {
      newPathname = pathname.replace(`/${locale}`, '')
      if (!newPathname.startsWith('/')) {
        newPathname = `/${newPathname}`
      }
    }
    
    router.push(newPathname)
    router.refresh()
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-gray-600" />
        <select
          className="text-sm border rounded px-2 py-1 bg-white"
          disabled
        >
          <option>{localeNames[locale as keyof typeof localeNames]}</option>
        </select>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        className="text-sm border rounded px-2 py-1 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  )
}
