'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Building2, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from '@/components/i18n-provider'

interface CustomerData {
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
    plan: {
      name: string
      price: number
    }
  }
  _count: {
    chatbots: number
  }
  createdAt: string
}

export default function CustomersManagementPage() {
  const t = useTranslations('admin.customers')
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [page])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response: any = await api.adminGetCustomers(page, 10)
      setCustomers(response.data)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase()
    return (
      customer.companyName?.toLowerCase().includes(search) ||
      customer.user.email.toLowerCase().includes(search) ||
      customer.user.name?.toLowerCase().includes(search)
    )
  })

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

  if (loading && customers.length === 0) {
    return <div>{t('loadingCustomers')}</div>
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
          {t('createCustomer')}
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.company')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.plan')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.chatbots')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">
                      {customer.companyName || t('na')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.user.name || t('na')}
                    </div>
                    <div className="text-sm text-gray-500">{customer.user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {customer.subscription ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.subscription.plan.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${customer.subscription.plan.price}{t('perMonth')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">{t('details.noActiveSubscription')}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      customer.subscription?.status
                    )}`}
                  >
                    {t(`status.${customer.subscription?.status || 'NONE'}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer._count.chatbots}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/dashboard/admin/customers/${customer.id}`}
                    className="text-orange-600 hover:text-orange-900 font-medium inline-flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {t('table.actions')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t('noCustomersFound')}
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

      {/* Create Customer Modal */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadCustomers()
          }}
        />
      )}
    </div>
  )
}

function CreateCustomerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('admin.customers.createModal')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Register creates both user and customer
      await api.register(formData.email, formData.password, formData.name)
      alert(t('successMessage'))
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create customer:', error)
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
          <p className="text-sm text-gray-600 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')} {t('required')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('password')} {t('required')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('passwordPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('name')} {t('required')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('companyName')}
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('companyNamePlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('companyNameHelp')}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{t('note')}</strong> {t('noteMessage')}
            </p>
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
