'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { useConversations } from '@/hooks/use-conversations'
import { useChatbots } from '@/hooks/use-chatbots'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function ConversationsPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('conversations')
  const tCommon = useTranslations('common')
  const [selectedChatbot, setSelectedChatbot] = useState<string>('all')
  const { chatbots } = useChatbots()
  const { conversations, isLoading } = useConversations(
    selectedChatbot !== 'all' ? { chatbotId: selectedChatbot } : undefined
  )

  if (isLoading) {
    return <div>{tCommon('loading')}</div>
  }

  // Helper function to get translated status
  const getStatusLabel = (status: string) => {
    const statusKey = status.toLowerCase() as 'active' | 'closed' | 'archived'
    return t(`status.${statusKey}`)
  }

  // Helper function to get translated channel
  const getChannelLabel = (channel: string) => {
    const channelMap: Record<string, string> = {
      'WIDGET': 'widget',
      'WHATSAPP_CLOUD': 'whatsappCloud',
      'WHATSAPP_QR': 'whatsappQr',
      'WHATSAPP': 'whatsapp'
    }
    const channelKey = channelMap[channel] || channel.toLowerCase()
    return t(`channels.${channelKey}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="w-64">
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger>
              <SelectValue placeholder={t('filterByChatbot')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allChatbots')}</SelectItem>
              {chatbots?.map((chatbot: any) => (
                <SelectItem key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {conversations && conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noConversationsYet')}</h3>
            <p className="text-muted-foreground">
              {t('noConversationsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations?.map((conversation: any) => (
            <Link key={conversation.id} href={`/${locale}/dashboard/conversations/${conversation.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{conversation.externalUserId}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          conversation.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {getStatusLabel(conversation.status)}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                          {getChannelLabel(conversation.channel)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {conversation.chatbot?.name || t('unknownChatbot')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(conversation.lastMessageAt)}
                      </p>
                      {conversation._count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('messagesCount', { count: conversation._count.messages })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
