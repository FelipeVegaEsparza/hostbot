'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, User, CreditCard, Bot, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/components/i18n-provider'

interface CustomerDetails {
  id: string
  companyName: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  subscription?: {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    plan: {
      id: string
      name: string
      price: number
      maxChatbots: number
      maxMessagesPerMonth: number
    }
  }
  chatbots: Array<{
    id: string
    name: string
    isActive: boolean
    createdAt: string
  }>
  stats: {
    totalChatbots: number
    totalUsageLogs: number
    monthlyMessages: number
  }
  createdAt: string
}

export default function CustomerDetailsPage() {
  const t = useTranslations('admin.customers.details')
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomer()
  }, [customerId])

  const loadCustomer = async () => {
    try {
      setLoading(true)
      const data: any = await api.adminGetCustomer(customerId)
      setCustomer(data)
    } catch (error) {
      console.error('Failed to load customer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>{t('loadingDetails', { ns: 'admin.customers' })}</div>
  }

  if (!customer) {
    return <div>{t('customerNotFound', { ns: 'admin.customers' })}</div>
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('companyInformation')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">{t('companyName')}</p>
              <p className="text-base font-medium text-gray-900">
                {customer.companyName || t('na', { ns: 'admin.customers' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('customerId')}</p>
              <p className="text-base font-mono text-gray-900">{customer.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('created')}</p>
              <p className="text-base text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            {t('userInformation')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">{t('name')}</p>
              <p className="text-base font-medium text-gray-900">
                {customer.user.name || t('na', { ns: 'admin.customers' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('email')}</p>
              <p className="text-base text-gray-900">{customer.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('role')}</p>
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${
                  customer.user.role === 'ADMIN'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {customer.user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {t('subscription')}
        </h3>
        {customer.subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('plan')}</p>
              <p className="text-base font-medium text-gray-900">
                {customer.subscription.plan.name}
              </p>
              <p className="text-sm text-gray-500">
                ${customer.subscription.plan.price}{t('perMonth', { ns: 'admin.customers' })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('status')}</p>
              <span
                className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
                  customer.subscription.status
                )}`}
              >
                {t(`status.${customer.subscription.status}`, { ns: 'admin.customers' })}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('currentPeriod')}</p>
              <p className="text-sm text-gray-900">
                {new Date(customer.subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                {new Date(customer.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('limits')}</p>
              <p className="text-sm text-gray-900">
                {customer.subscription.plan.maxChatbots === -1
                  ? t('unlimited')
                  : customer.subscription.plan.maxChatbots}{' '}
                {t('chatbotsLimit')}
              </p>
              <p className="text-sm text-gray-900">
                {customer.subscription.plan.maxMessagesPerMonth === -1
                  ? t('unlimited')
                  : customer.subscription.plan.maxMessagesPerMonth.toLocaleString()}{' '}
                {t('messagesLimit')}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">{t('noActiveSubscription')}</p>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('totalChatbots')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {customer.stats.totalChatbots}
              </p>
            </div>
            <Bot className="w-10 h-10 text-orange-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('messagesThisMonth')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {customer.stats.monthlyMessages.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('totalUsageLogs')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {customer.stats.totalUsageLogs.toLocaleString()}
              </p>
            </div>
            <MessageSquare className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Chatbots List */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('chatbots')}</h3>
        {customer.chatbots.length > 0 ? (
          <div className="space-y-3">
            {customer.chatbots.map((chatbot) => (
              <div
                key={chatbot.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{chatbot.name}</p>
                  <p className="text-sm text-gray-500">
                    {t('created')} {new Date(chatbot.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    chatbot.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {chatbot.isActive ? t('active') : t('inactive')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">{t('noChatbotsYet')}</p>
        )}
      </div>
    </div>
  )
}
