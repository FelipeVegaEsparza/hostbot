import useSWR from 'swr'
import { api } from '@/lib/api'
import { Conversation, Message } from '@/types'

export function useConversations(params?: { chatbotId?: string; page?: number; limit?: number }) {
  const key = params ? `/conversations?${JSON.stringify(params)}` : '/conversations'
  
  const { data, error, isLoading, mutate } = useSWR<{ data: Conversation[]; total: number }>(
    key,
    async () => api.getConversations(params) as Promise<{ data: Conversation[]; total: number }>,
    { revalidateOnFocus: false }
  )

  return {
    conversations: data?.data,
    total: data?.total,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useConversation(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Conversation | undefined>(
    id ? `/conversations/${id}` : null,
    id ? async () => api.getConversation(id) as Promise<Conversation> : null,
    { revalidateOnFocus: false }
  )

  return {
    conversation: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useMessages(conversationId: string | null, page = 1, limit = 50) {
  const { data, error, isLoading, mutate } = useSWR<{ data: Message[]; total: number } | undefined>(
    conversationId ? `/conversations/${conversationId}/messages?page=${page}&limit=${limit}` : null,
    conversationId ? async () => api.getMessages(conversationId, page, limit) as Promise<{ data: Message[]; total: number }> : null,
    { revalidateOnFocus: false }
  )

  return {
    messages: data?.data,
    total: data?.total,
    isLoading,
    isError: error,
    mutate,
  }
}
