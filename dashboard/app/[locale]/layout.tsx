import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-context'
import { I18nProvider } from '@/components/i18n-provider'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chatbot SaaS - Dashboard',
  description: 'Admin dashboard for AI-powered chatbot platform',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

const locales = ['es', 'en']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate locale
  if (!locales.includes(locale)) {
    notFound()
  }

  // Load messages
  const messages = (await import(`@/messages/${locale}.json`)).default

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
