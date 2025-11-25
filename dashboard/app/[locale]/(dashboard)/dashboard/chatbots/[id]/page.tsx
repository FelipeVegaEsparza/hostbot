'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { useChatbot } from '@/hooks/use-chatbots'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { value: 'groq', label: 'Groq', models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'] },
  { value: 'google', label: 'Google', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
]

export default function ChatbotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const id = params.id as string
  const t = useTranslations('chatbots')
  const tCommon = useTranslations('common')
  const { chatbot, isLoading, mutate } = useChatbot(id)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    systemPrompt: '',
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (chatbot) {
      setFormData({
        name: chatbot.name,
        description: chatbot.description || '',
        aiProvider: chatbot.aiProvider,
        aiModel: chatbot.aiModel,
        systemPrompt: chatbot.systemPrompt || '',
        isActive: chatbot.isActive,
      })
    }
  }, [chatbot])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateChatbot(id, formData)
      mutate()
      alert(t('chatbotUpdatedSuccess'))
    } catch (error) {
      console.error('Failed to update chatbot:', error)
      alert(t('chatbotUpdateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const selectedProvider = AI_PROVIDERS.find(p => p.value === formData.aiProvider)

  if (isLoading) {
    return <div>{tCommon('loading')}</div>
  }

  if (!chatbot) {
    return <div>{t('chatbotNotFound')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/chatbots`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{chatbot.name}</h1>
          <p className="text-muted-foreground">{t('configureChatbotSettings')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInformation')}</CardTitle>
            <CardDescription>{t('basicInformationDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{tCommon('status')}</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value: string) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{tCommon('active')}</SelectItem>
                  <SelectItem value="inactive">{tCommon('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('aiConfiguration')}</CardTitle>
            <CardDescription>{t('aiConfigurationDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">{t('aiProvider')}</Label>
              <Select
                value={formData.aiProvider}
                onValueChange={(value: string) => {
                  const provider = AI_PROVIDERS.find(p => p.value === value)
                  setFormData({
                    ...formData,
                    aiProvider: value,
                    aiModel: provider?.models[0] || '',
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">{t('model')}</Label>
              <Select
                value={formData.aiModel}
                onValueChange={(value: string) => setFormData({ ...formData, aiModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('systemPrompt')}</CardTitle>
            <CardDescription>
              {t('systemPromptDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder={t('systemPromptPlaceholder')}
              rows={8}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('widgetEmbedCode')}</CardTitle>
            <CardDescription>
              {t('widgetEmbedCodeDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://cdn.example.com'}/widget.js"></script>
<chatbot-widget 
  bot-id="${chatbot.id}"
  api-url="${process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'}"
  theme="light"
  position="bottom-right">
</chatbot-widget>`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
