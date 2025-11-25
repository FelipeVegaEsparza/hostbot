'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from '@/components/i18n-provider'
import { useConversation, useMessages } from '@/hooks/use-conversations'
import { useWebSocket } from '@/hooks/use-websocket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Message } from '@/types'

export default function ConversationDetailPage() {
  const params = useParams()
  const locale = params.locale as string
  const id = params.id as string
  const t = useTranslations('conversations')
  const tCommon = useTranslations('common')
  const { conversation } = useConversation(id)
  const { messages, mutate } = useMessages(id)
  const { on, joinConversation, leaveConversation } = useWebSocket()
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) {
      joinConversation(id)
      return () => leaveConversation(id)
    }
  }, [id, joinConversation, leaveConversation])

  useEffect(() => {
    const unsubscribe = on('message', (data: Message) => {
      if (data.conversationId === id) {
        mutate()
      }
    })
    return unsubscribe
  }, [id, on, mutate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    setSending(true)
    try {
      await api.sendMessage({
        conversationId: id,
        content: messageText,
      })
      setMessageText('')
      mutate()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
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

  if (!conversation) {
    return <div>{tCommon('loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/conversations`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{conversation.externalUserId}</h1>
          <p className="text-sm text-muted-foreground">
            {conversation.chatbot?.name || t('unknownChatbot')} • {getChannelLabel(conversation.channel)}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 text-sm rounded-full ${
            conversation.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {getStatusLabel(conversation.status)}
          </span>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>{t('messages')}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages?.map((message: any) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.role === 'USER'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'ASSISTANT'
                      ? 'bg-muted'
                      : 'bg-accent'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={t('typeMessage')}
              disabled={sending}
            />
            <Button type="submit" disabled={sending || !messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
