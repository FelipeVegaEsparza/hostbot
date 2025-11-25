'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  customer: {
    id: string
    companyName: string
    user: {
      email: string
      name: string
    }
  }
  plan: {
    id: string
    name: string
    price: number
  }
}

interface Customer {
  id: string
  companyName: string
  user: {
    email: string
  }
}

interface Plan {
  id: string
  name: string
  price: number
}

export default function SubscriptionsManagementPage() {
  const t = useTranslations('admin.subscriptions')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [page])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const response: any = await api.adminGetSubscriptions(page, 10)
      setSubscriptions(response.data)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    if (!confirm(t('actions.changeStatusConfirm', { status: newStatus }))) {
      return
    }

    try {
      setChangingStatus(subscriptionId)
      await api.adminUpdateSubscription(subscriptionId, {
        status: newStatus as any,
      })
      await loadSubscriptions()
      alert(t('actions.statusUpdatedSuccess'))
    } catch (error: any) {
      console.error('Failed to update subscription:', error)
      alert(error.message || t('actions.statusUpdateError'))
    } finally {
      setChangingStatus(null)
    }
  }

  const getStatusColor = (status: string) => {
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

  if (loading && subscriptions.length === 0) {
    return <div>{t('loadingSubscriptions')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('createSubscription')}
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.customer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.plan')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.period')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {subscription.customer.companyName || t('na')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {subscription.customer.user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {subscription.plan.name}
                    </div>
                    <div className="text-sm text-gray-500">${subscription.plan.price}{t('perMonth')}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {t(`status.${subscription.status}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} -
                  </div>
                  <div>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={subscription.status}
                    onChange={(e) => handleStatusChange(subscription.id, e.target.value)}
                    disabled={changingStatus === subscription.id}
                    className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ACTIVE">{t('status.ACTIVE')}</option>
                    <option value="SUSPENDED">{t('status.SUSPENDED')}</option>
                    <option value="CANCELLED">{t('status.CANCELLED')}</option>
                    <option value="EXPIRED">{t('status.EXPIRED')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('noSubscriptionsFound')}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-700">
          {t('pagination.page', { current: page, total: totalPages })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('pagination.previous')}
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {t('pagination.next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateSubscriptionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadSubscriptions()
          }}
        />
      )}
    </div>
  )
}

function CreateSubscriptionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('admin.subscriptions.createModal')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [formData, setFormData] = useState({
    customerId: '',
    planId: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [customersData, plansData]: any = await Promise.all([
        api.adminGetCustomers(1, 100),
        api.adminGetPlans(),
      ])
      setCustomers(customersData.data)
      setPlans(plansData)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.adminCreateSubscription(formData)
      alert(t('successMessage'))
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create subscription:', error)
      alert(error.message || t('errorMessage'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">{t('title')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('customerRequired')}
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">{t('selectCustomer')}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName || customer.user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('planRequired')}</label>
            <select
              required
              value={formData.planId}
              onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">{t('selectPlan')}</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}/mo
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? t('creating') : t('create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
