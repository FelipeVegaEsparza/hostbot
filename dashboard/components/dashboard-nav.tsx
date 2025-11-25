'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations, useLocale } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  Database,
  MessageCircle,
  CreditCard,
  Settings,
  LogOut,
  Shield
} from 'lucide-react'
import { logout } from '@/lib/auth'
import { Button } from './ui/button'
import { useAuth } from '@/lib/auth-context'
import { LanguageSelector } from './language-selector'

export function DashboardNav() {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const { isAdmin } = useAuth()
  const t = useTranslations('navigation')

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/dashboard`, icon: LayoutDashboard },
    { name: t('chatbots'), href: `/${locale}/dashboard/chatbots`, icon: Bot },
    { name: t('conversations'), href: `/${locale}/dashboard/conversations`, icon: MessageSquare },
    { name: t('knowledgeBase'), href: `/${locale}/dashboard/knowledge`, icon: Database },
    { name: t('whatsapp'), href: `/${locale}/dashboard/whatsapp`, icon: MessageCircle },
    { name: t('billing'), href: `/${locale}/dashboard/billing`, icon: CreditCard },
    { name: t('settings'), href: `/${locale}/dashboard/settings`, icon: Settings },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="flex h-full w-64 flex-col glass-strong border-r border-white/20 shadow-2xl relative overflow-hidden">
      {/* Gradient overlay decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Logo section */}
      <div className="p-6 border-b border-white/10 relative z-10">
        <Link href={`/${locale}/dashboard`} className="block group">
          <img
            src="/logo.png"
            alt={t('appTitle')}
            className="h-12 w-auto object-contain hover:scale-105 transition-all duration-300 drop-shadow-lg group-hover:drop-shadow-2xl"
          />
        </Link>
      </div>

      {/* Language selector */}
      <div className="px-6 py-4 border-b border-white/10 relative z-10">
        <LanguageSelector />
      </div>

      {/* Navigation links */}
      <div className="flex-1 space-y-1 px-3 py-4 relative z-10">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-primary via-primary/90 to-secondary text-white shadow-lg shadow-primary/50 scale-105'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/10 hover:scale-105 hover:shadow-md'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Glow effect para item activo */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-xl -z-10 animate-pulse-glow" />
              )}

              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300",
                isActive ? "animate-bounce-subtle" : "group-hover:scale-110"
              )} />
              <span className="relative">
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/50 rounded-full" />
                )}
              </span>
            </Link>
          )
        })}

        {/* Admin Panel Link - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-3 border-t border-white/10" />
            <Link
              href={`/${locale}/dashboard/admin`}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group relative overflow-hidden',
                pathname?.startsWith(`/${locale}/dashboard/admin`)
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                  : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:scale-105 hover:shadow-md'
              )}
            >
              {pathname?.startsWith(`/${locale}/dashboard/admin`) && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 blur-xl -z-10 animate-pulse-glow" />
              )}
              <Shield className={cn(
                "h-5 w-5 transition-all duration-300",
                pathname?.startsWith(`/${locale}/dashboard/admin`) ? "animate-bounce-subtle" : "group-hover:scale-110"
              )} />
              <span>{t('adminPanel')}</span>
            </Link>
          </>
        )}
      </div>

      {/* Logout button */}
      <div className="p-3 border-t border-white/10 relative z-10">
        <Button
          variant="ghost"
          className="w-full justify-start hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all duration-300 hover:scale-105 group rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
          {t('logout')}
        </Button>
      </div>
    </nav>
  )
}
