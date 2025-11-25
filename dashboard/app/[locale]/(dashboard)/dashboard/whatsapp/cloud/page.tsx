'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { useChatbots } from '@/hooks/use-chatbots'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { WhatsAppCloudAccount } from '@/types'

export default function WhatsAppCloudPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('whatsapp.cloudApi')
  const tSelect = useTranslations('whatsapp.qrCode.selectChatbot')
  const { chatbots } = useChatbots()
  const [selectedChatbot, setSelectedChatbot] = useState<string>('')
  const [account, setAccount] = useState<WhatsAppCloudAccount | null>(null)
  const [formData, setFormData] = useState({
    phoneNumberId: '',
    accessToken: '',
    webhookVerifyToken: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedChatbot) {
      loadAccount(selectedChatbot)
    }
  }, [selectedChatbot])

  const loadAccount = async (chatbotId: string) => {
    try {
      const data = await api.getWhatsAppCloudAccount(chatbotId) as WhatsAppCloudAccount
      setAccount(data)
      setFormData({
        phoneNumberId: data.phoneNumberId,
        accessToken: data.accessToken,
        webhookVerifyToken: data.webhookVerifyToken,
      })
    } catch (error) {
      setAccount(null)
      setFormData({
        phoneNumberId: '',
        accessToken: '',
        webhookVerifyToken: '',
      })
    }
  }

  const handleSave = async () => {
    if (!selectedChatbot) return
    setSaving(true)
    try {
      if (account) {
        await api.updateWhatsAppCloudAccount(selectedChatbot, formData)
      } else {
        await api.createWhatsAppCloudAccount({
          chatbotId: selectedChatbot,
          ...formData,
        })
      }
      alert(t('configuration.successMessage'))
      loadAccount(selectedChatbot)
    } catch (error) {
      console.error('Failed to save:', error)
      alert(t('configuration.errorMessage'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/whatsapp`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          <p className="text-muted-foreground">
            {t('pageSubtitle')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tSelect('title')}</CardTitle>
          <CardDescription>
            {tSelect('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger>
              <SelectValue placeholder={tSelect('placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {chatbots?.map((chatbot: { id: string; name: string }) => (
                <SelectItem key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChatbot && (
        <Card>
          <CardHeader>
            <CardTitle>{t('configuration.title')}</CardTitle>
            <CardDescription>
              {t('configuration.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">{t('configuration.phoneNumberId')}</Label>
              <Input
                id="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                placeholder={t('configuration.phoneNumberIdPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('configuration.phoneNumberIdHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessToken">{t('configuration.accessToken')}</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder={t('configuration.accessTokenPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('configuration.accessTokenHelp')}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookVerifyToken">{t('configuration.webhookVerifyToken')}</Label>
              <Input
                id="webhookVerifyToken"
                value={formData.webhookVerifyToken}
                onChange={(e) => setFormData({ ...formData, webhookVerifyToken: e.target.value })}
                placeholder={t('configuration.webhookVerifyTokenPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('configuration.webhookVerifyTokenHelp')}
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? t('configuration.saving') : account ? t('configuration.update') : t('configuration.save')}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('webhook.title')}</CardTitle>
          <CardDescription>
            {t('webhook.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <code className="text-sm">
              {process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}/whatsapp-cloud/webhook
            </code>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('webhook.help')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
