'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Plus, Edit, Trash2, Check } from 'lucide-react'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
  maxChatbots: number
  maxMessagesPerMonth: number
  aiProviders: string[]
  features: Record<string, any>
}

export default function PlansManagementPage() {
  const t = useTranslations('admin.plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data: any = await api.adminGetPlans()
      setPlans(data)
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(t('deleteConfirm', { name: planName }))) {
      return
    }

    try {
      await api.adminDeletePlan(planId)
      await loadPlans()
      alert(t('deleteSuccess'))
    } catch (error: any) {
      console.error('Failed to delete plan:', error)
      alert(error.message || t('deleteError'))
    }
  }

  if (loading) {
    return <div>{t('loadingPlans')}</div>
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
          {t('createPlan')}
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ${plan.price}
                  <span className="text-sm text-gray-600 font-normal">{t('card.perMonth')}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPlan(plan)}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>
                  {plan.maxChatbots === -1 ? t('card.unlimited') : plan.maxChatbots} {t('card.chatbots')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>
                  {plan.maxMessagesPerMonth === -1
                    ? t('card.unlimited')
                    : plan.maxMessagesPerMonth.toLocaleString()}{' '}
                  {t('card.messagesPerMonth')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600" />
                <span>{t('card.aiProviders')} {plan.aiProviders.join(', ')}</span>
              </div>
            </div>

            {plan.features && Object.keys(plan.features).length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">{t('card.features')}</p>
                <div className="space-y-1">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <div key={key} className="text-xs text-gray-600">
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {t('noPlansYet')}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlan) && (
        <PlanModal
          plan={editingPlan}
          onClose={() => {
            setShowCreateModal(false)
            setEditingPlan(null)
          }}
          onSuccess={() => {
            setShowCreateModal(false)
            setEditingPlan(null)
            loadPlans()
          }}
        />
      )}
    </div>
  )
}

function PlanModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: Plan | null
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('admin.plans')
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    currency: plan?.currency || 'USD',
    maxChatbots: plan?.maxChatbots || 1,
    maxMessagesPerMonth: plan?.maxMessagesPerMonth || 100,
    aiProviders: plan?.aiProviders.join(', ') || 'openai',
    features: JSON.stringify(plan?.features || {}, null, 2),
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        name: formData.name,
        price: Number(formData.price),
        currency: formData.currency as 'USD' | 'CLP',
        maxChatbots: Number(formData.maxChatbots),
        maxMessagesPerMonth: Number(formData.maxMessagesPerMonth),
        aiProviders: formData.aiProviders.split(',').map((p) => p.trim()),
        features: JSON.parse(formData.features),
      }

      if (plan) {
        await api.adminUpdatePlan(plan.id, data)
        alert(t('updateSuccess'))
      } else {
        await api.adminCreatePlan(data)
        alert(t('createSuccess'))
      }

      onSuccess()
    } catch (error: any) {
      console.error('Failed to save plan:', error)
      alert(error.message || t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {plan ? t('editPlan') : t('createNewPlan')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.planNameRequired')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.priceRequired')}
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.currencyRequired')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="USD">USD</option>
                <option value="CLP">CLP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.maxChatbotsRequired')}
              </label>
              <input
                type="number"
                required
                value={formData.maxChatbots}
                onChange={(e) =>
                  setFormData({ ...formData, maxChatbots: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.maxMessagesPerMonthRequired')}
              </label>
              <input
                type="number"
                required
                value={formData.maxMessagesPerMonth}
                onChange={(e) =>
                  setFormData({ ...formData, maxMessagesPerMonth: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.aiProvidersRequired')}
            </label>
            <input
              type="text"
              required
              value={formData.aiProviders}
              onChange={(e) => setFormData({ ...formData, aiProviders: e.target.value })}
              placeholder={t('form.aiProvidersPlaceholder')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.featuresJson')}
            </label>
            <textarea
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? t('form.saving') : plan ? t('form.updateButton') : t('form.createButton')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {t('form.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
