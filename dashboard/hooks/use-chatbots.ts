import useSWR from 'swr'
import { api } from '@/lib/api'
import { Chatbot } from '@/types'

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useChatbots() {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Chatbot> | Chatbot[]>(
    '/chatbots',
    async () => api.getChatbots() as Promise<PaginatedResponse<Chatbot> | Chatbot[]>,
    { revalidateOnFocus: false }
  )

  // Handle both paginated and non-paginated responses
  const chatbots = data ? (Array.isArray(data) ? data : data.data) : undefined

  return {
    chatbots,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useChatbot(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Chatbot | undefined>(
    id ? `/chatbots/${id}` : null,
    id ? async () => api.getChatbot(id) as Promise<Chatbot> : null,
    { revalidateOnFocus: false }
  )

  return {
    chatbot: data,
    isLoading,
    isError: error,
    mutate,
  }
}
