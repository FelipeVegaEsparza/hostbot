'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Shield, User, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ConfirmationModal } from '@/components/confirmation-modal'

interface UserData {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  customer?: {
    id: string
    companyName: string
  }
}

interface PaginatedResponse {
  data: UserData[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function UsersManagementPage() {
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('common')
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  })

  useEffect(() => {
    loadUsers()
  }, [page])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response: any = await api.adminGetUsers(page, 10)
      setUsers(response.data)
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Failed to load users:', error)
      setConfirmModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: t('messages.loadUsersError'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar cambio de rol',
      message: t('actions.changeRoleConfirm', { role: newRole }),
      onConfirm: async () => {
        try {
          setChangingRole(userId)
          await api.adminUpdateUserRole(userId, newRole as 'USER' | 'ADMIN')
          await loadUsers()
          setConfirmModal({
            isOpen: true,
            type: 'success',
            title: 'Éxito',
            message: t('messages.roleUpdatedSuccess'),
          })
        } catch (error: any) {
          console.error('Failed to update user role:', error)
          setConfirmModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.message || t('messages.roleUpdateError'),
          })
        } finally {
          setChangingRole(null)
        }
      },
    })
  }

  if (loading && users.length === 0) {
    return <div>{t('loadingUsers')}</div>
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
          {t('createUser')}
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.company')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.created')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || t('na')}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.customer?.companyName || t('na')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role === 'ADMIN' ? (
                      <Shield className="w-3 h-3 mr-1" />
                    ) : (
                      <User className="w-3 h-3 mr-1" />
                    )}
                    {t(`roles.${user.role}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleRoleChange(user.id, user.role)}
                    disabled={changingRole === user.id}
                    className={`text-orange-600 hover:text-orange-900 font-medium ${
                      changingRole === user.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {changingRole === user.id
                      ? t('actions.changing')
                      : t('actions.changeTo', { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' })}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-700">
          {tCommon('page')} {page} {tCommon('of')} {totalPages}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {tCommon('previous')}
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {tCommon('next')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadUsers()
            setConfirmModal({
              isOpen: true,
              type: 'success',
              title: 'Usuario creado',
              message: t('messages.userCreatedSuccess'),
            })
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        showCancel={!!confirmModal.onConfirm}
      />
    </div>
  )
}

function CreateUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('common')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    role: 'USER' as 'USER' | 'ADMIN',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.register(formData.email, formData.password, formData.name)
      onSuccess()
    } catch (error: any) {
      console.error('Failed to create user:', error)
      alert(error.message || t('messages.userCreatedError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">{t('createNewUser')}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.email')} {t('form.required')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('form.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.password')} {t('form.required')}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('form.passwordPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.name')} {t('form.required')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('form.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.companyName')}
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={t('form.companyNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.role')} {t('form.required')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="USER">{t('roles.USER')}</option>
              <option value="ADMIN">{t('roles.ADMIN')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? tCommon('loading') : t('createUser')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
