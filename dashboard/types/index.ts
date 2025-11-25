export interface User {
  id: string
  email: string
  name: string | null
  role: 'USER' | 'ADMIN'
}

export interface Customer {
  id: string
  userId: string
  companyName: string | null
  subscription?: Subscription
}

export interface Plan {
  id: string
  name: string
  price: number
  maxChatbots: number
  maxMessagesPerMonth: number
  aiProviders: string[]
  features: Record<string, any>
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED'
  currentPeriodStart: string
  currentPeriodEnd: string
  plan?: Plan
}

export interface Chatbot {
  id: string
  customerId: string
  name: string
  description: string | null
  aiProvider: string
  aiModel: string
  aiConfig: Record<string, any>
  systemPrompt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  chatbotId: string
  externalUserId: string
  channel: 'WIDGET' | 'WHATSAPP_CLOUD' | 'WHATSAPP_QR'
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  lastMessageAt: string
  createdAt: string
  chatbot?: Chatbot
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  conversationId: string
  content: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  metadata: Record<string, any> | null
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  createdAt: string
}

export interface KnowledgeBase {
  id: string
  customerId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    items: number
  }
}

export interface KnowledgeItem {
  id: string
  knowledgeBaseId: string
  title: string
  content: string
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface WhatsAppCloudAccount {
  id: string
  chatbotId: string
  phoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  isActive: boolean
}

export interface WhatsAppQRSession {
  id: string
  chatbotId: string
  sessionId: string
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED'
  qrCode: string | null
  lastConnectedAt: string | null
}

export interface UsageStats {
  messagesThisMonth: number
  conversationsTotal: number
  chatbotsActive: number
  messagesLimit: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: 'USD' | 'CLP'
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  paymentMethod: string
  dueDate: string
  paidAt: string | null
  createdAt: string
}
