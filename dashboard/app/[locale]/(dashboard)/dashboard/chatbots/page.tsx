'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { useChatbots } from '@/hooks/use-chatbots'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bot, Edit, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
  { value: 'groq', label: 'Groq', models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'] },
  { value: 'google', label: 'Google', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
]

export default function ChatbotsPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('chatbots')
  const tCommon = useTranslations('common')
  const { chatbots, isLoading, mutate } = useChatbots()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedChatbot, setSelectedChatbot] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    systemPrompt: '',
  })

  const handleCreate = async () => {
    try {
      await api.createChatbot(formData)
      setShowCreateDialog(false)
      setFormData({
        name: '',
        description: '',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        systemPrompt: '',
      })
      mutate()
    } catch (error) {
      console.error('Failed to create chatbot:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedChatbot) return
    try {
      await api.deleteChatbot(selectedChatbot)
      setShowDeleteDialog(false)
      setSelectedChatbot(null)
      mutate()
    } catch (error) {
      console.error('Failed to delete chatbot:', error)
    }
  }

  const selectedProvider = AI_PROVIDERS.find(p => p.value === formData.aiProvider)

  if (isLoading) {
    return <div>{tCommon('loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      {chatbots && chatbots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noChatbotsYet')}</h3>
            <p className="text-muted-foreground mb-4">{t('createFirstChatbot')}</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chatbots?.map((chatbot: any) => (
            <Card key={chatbot.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{chatbot.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {chatbot.description || t('noDescription')}
                    </CardDescription>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${chatbot.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('provider')}:</span>
                    <span className="font-medium">{chatbot.aiProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('model')}:</span>
                    <span className="font-medium">{chatbot.aiModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('created')}:</span>
                    <span className="font-medium">{formatDateTime(chatbot.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/${locale}/dashboard/chatbots/${chatbot.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('edit')}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChatbot(chatbot.id)
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('create')}</DialogTitle>
            <DialogDescription>
              {t('configureNewChatbot')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">{t('systemPromptOptional')}</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder={t('systemPromptPlaceholder')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleCreate}>{tCommon('create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirmMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
