'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/components/i18n-provider'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { User } from '@/types'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tValidation = useTranslations('validation')
  const tNotifications = useTranslations('notifications')
  const tCommon = useTranslations('common')
  
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await api.getProfile() as User
      setUser(data)
      setFormData({
        name: data.name || '',
        email: data.email,
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      // API call to update profile would go here
      alert(tNotifications('profileUpdated'))
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(tNotifications('profileUpdateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(tValidation('passwordsDoNotMatch'))
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert(tValidation('passwordMinLength', { min: 8 }))
      return
    }

    setSaving(true)
    try {
      // API call to change password would go here
      alert(tNotifications('passwordChanged'))
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      alert(tNotifications('passwordChangeFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>{tCommon('loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profileInformation')}</CardTitle>
          <CardDescription>
            {t('profileInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{tCommon('name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{tCommon('email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('saving') : t('saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
          <CardDescription>
            {t('changePasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? t('changing') : t('changePasswordButton')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('accountInformation')}</CardTitle>
          <CardDescription>
            {t('accountInformationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('accountId')}:</span>
            <span className="font-medium">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('role')}:</span>
            <span className="font-medium">{user?.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
