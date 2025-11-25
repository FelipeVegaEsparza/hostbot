'use client'

import { createContext, useContext } from 'react'

type Messages = Record<string, any>

interface I18nContextType {
  locale: string
  messages: Messages
  t: (key: string, params?: Record<string, any>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode
  locale: string
  messages: Messages
}) {
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value !== 'string') {
      return key
    }

    // Simple parameter replacement
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || '')
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ locale, messages, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslations(namespace?: string) {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useTranslations must be used within I18nProvider')
  }

  return (key: string, params?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return context.t(fullKey, params)
  }
}

export function useLocale() {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useLocale must be used within I18nProvider')
  }

  return context.locale
}
