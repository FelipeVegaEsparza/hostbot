'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Users, Building2, CreditCard, MessageSquare, Bot } from 'lucide-react'

interface SystemStats {
  users: {
    total: number
    recent: Array<{
      id: string
      email: string
      name: string
      role: string
      createdAt: string
    }>
  }
  customers: {
    total: number
  }
  subscriptions: {
    total: number
    active: number
    inactive: number
  }
  chatbots: {
    total: number
    active: number
    inactive: number
  }
  plans: {
    total: number
  }
}

export default function AdminOverviewPage() {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data: any = await api.adminGetStats()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  if (!stats) {
    return <div>{t('stats')}</div>
  }

  const statCards = [
    {
      title: t('totalUsers'),
      value: stats.users.total,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: t('totalCustomers'),
      value: stats.customers.total,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      title: t('activeSubscriptions'),
      value: stats.subscriptions.active,
      icon: CreditCard,
      color: 'bg-purple-500',
    },
    {
      title: t('totalChatbots'),
      value: stats.chatbots.total,
      icon: Bot,
      color: 'bg-orange-500',
    },
    {
      title: t('activeChatbots'),
      value: stats.chatbots.active,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
    {
      title: t('availablePlans'),
      value: stats.plans.total,
      icon: CreditCard,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('systemOverview')}</h2>
        <p className="text-gray-600 mt-1">{t('keyMetrics')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Subscription Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('subscriptionStatus')}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">{tCommon('total')}</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.subscriptions.total}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{tCommon('active')}</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.subscriptions.active}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">{tCommon('inactive')}</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.subscriptions.inactive}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('recentUsers')}
        </h3>
        <div className="space-y-3">
          {stats.users.recent.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3 border-b last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {user.role}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
