const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

class APIClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
      if (this.token) {
        console.log('Token loaded from localStorage')
      }
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      // Only clear token and redirect if it's not the login endpoint
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        console.error('Unauthorized request to:', endpoint)
        this.clearToken()
        if (typeof window !== 'undefined') {
          // Get current locale from path
          const path = window.location.pathname;
          const localeMatch = path.match(/^\/([a-z]{2})\//);
          const locale = localeMatch ? localeMatch[1] : 'en'; // Default to 'en' if not found

          window.location.href = `/${locale}/login`;
        }
      }
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || 'Request failed')
    }

    return response.json()
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const response = await this.request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })

    if (response.accessToken) {
      this.setToken(response.accessToken)
      console.log('Token saved successfully after registration')
    }

    return response
  }

  async login(email: string, password: string) {
    const response = await this.request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.accessToken) {
      this.setToken(response.accessToken)
      console.log('Token saved successfully')
    } else {
      console.error('No accessToken in response:', response)
      throw new Error('No access token received')
    }

    return response
  }

  async getProfile() {
    return this.request('/auth/me')
  }

  // Chatbots
  async getChatbots() {
    return this.request('/chatbots')
  }

  async getChatbot(id: string) {
    return this.request(`/chatbots/${id}`)
  }

  async createChatbot(data: any) {
    return this.request('/chatbots', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateChatbot(id: string, data: any) {
    return this.request(`/chatbots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteChatbot(id: string) {
    return this.request(`/chatbots/${id}`, {
      method: 'DELETE',
    })
  }

  // Conversations
  async getConversations(params?: { chatbotId?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.chatbotId) query.append('chatbotId', params.chatbotId)
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())

    return this.request(`/conversations?${query.toString()}`)
  }

  async getConversation(id: string) {
    return this.request(`/conversations/${id}`)
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    return this.request(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`)
  }

  async sendMessage(data: { conversationId: string; content: string }) {
    return this.request('/messages/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Knowledge Base
  async getKnowledgeBases() {
    return this.request('/knowledge/bases')
  }

  async getKnowledgeBase(id: string) {
    return this.request(`/knowledge/bases/${id}`)
  }

  async createKnowledgeBase(data: { name: string; description?: string }) {
    return this.request('/knowledge/bases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateKnowledgeBase(id: string, data: { name?: string; description?: string }) {
    return this.request(`/knowledge/bases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteKnowledgeBase(id: string) {
    return this.request(`/knowledge/bases/${id}`, {
      method: 'DELETE',
    })
  }

  async getKnowledgeItems(knowledgeBaseId: string) {
    return this.request(`/knowledge/bases/${knowledgeBaseId}/items`)
  }

  async createKnowledgeItem(knowledgeBaseId: string, data: { title: string; content: string }) {
    return this.request('/knowledge/items', {
      method: 'POST',
      body: JSON.stringify({ ...data, knowledgeBaseId }),
    })
  }

  async updateKnowledgeItem(itemId: string, data: { title?: string; content?: string }) {
    return this.request(`/knowledge/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteKnowledgeItem(itemId: string) {
    return this.request(`/knowledge/items/${itemId}`, {
      method: 'DELETE',
    })
  }

  // WhatsApp Cloud
  async getWhatsAppCloudAccount(chatbotId: string) {
    return this.request(`/whatsapp-cloud/account/${chatbotId}`)
  }

  async createWhatsAppCloudAccount(data: any) {
    return this.request('/whatsapp-cloud/account', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWhatsAppCloudAccount(chatbotId: string, data: any) {
    return this.request(`/whatsapp-cloud/account/${chatbotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // WhatsApp QR
  async initWhatsAppQRSession(chatbotId: string) {
    return this.request('/whatsapp-qr/init', {
      method: 'POST',
      body: JSON.stringify({ chatbotId }),
    })
  }

  async getWhatsAppQRCode(sessionId: string) {
    return this.request(`/whatsapp-qr/qr-code/${sessionId}`)
  }

  async getWhatsAppQRStatus(sessionId: string) {
    return this.request(`/whatsapp-qr/status/${sessionId}`)
  }

  async disconnectWhatsAppQR(sessionId: string) {
    return this.request('/whatsapp-qr/disconnect', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    })
  }

  async getWhatsAppQRSession(chatbotId: string) {
    return this.request(`/whatsapp-qr/session/${chatbotId}`)
  }

  // Billing
  async getSubscription() {
    return this.request('/billing/subscription')
  }

  async getUsageStats() {
    return this.request('/billing/usage')
  }

  async getInvoices() {
    return this.request('/billing/invoices')
  }

  async getInvoice(id: string) {
    return this.request(`/billing/invoices/${id}`)
  }

  async changePlan(planId: string) {
    return this.request('/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    })
  }

  // ============================================
  // Admin - Users
  // ============================================
  async adminGetUsers(page = 1, limit = 10) {
    return this.request(`/admin/users?page=${page}&limit=${limit}`)
  }

  async adminGetUser(userId: string) {
    return this.request(`/admin/users/${userId}`)
  }

  async adminUpdateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  }

  // ============================================
  // Admin - Customers
  // ============================================
  async adminGetCustomers(page = 1, limit = 10) {
    return this.request(`/admin/customers?page=${page}&limit=${limit}`)
  }

  async adminGetCustomer(customerId: string) {
    return this.request(`/admin/customers/${customerId}`)
  }

  async adminUpdateCustomer(customerId: string, data: { companyName?: string }) {
    return this.request(`/admin/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ============================================
  // Admin - Plans
  // ============================================
  async adminGetPlans() {
    return this.request('/billing/plans')
  }

  async adminCreatePlan(data: {
    name: string
    price: number
    currency: 'USD' | 'CLP'
    maxChatbots: number
    maxMessagesPerMonth: number
    aiProviders: string[]
    features: Record<string, any>
  }) {
    return this.request('/billing/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async adminUpdatePlan(planId: string, data: {
    name?: string
    price?: number
    currency?: 'USD' | 'CLP'
    maxChatbots?: number
    maxMessagesPerMonth?: number
    aiProviders?: string[]
    features?: Record<string, any>
  }) {
    return this.request(`/billing/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async adminDeletePlan(planId: string) {
    return this.request(`/billing/plans/${planId}`, {
      method: 'DELETE',
    })
  }

  // ============================================
  // Admin - Subscriptions
  // ============================================
  async adminGetSubscriptions(page = 1, limit = 10) {
    return this.request(`/admin/subscriptions?page=${page}&limit=${limit}`)
  }

  async adminCreateSubscription(data: { customerId: string; planId: string }) {
    return this.request('/admin/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async adminUpdateSubscription(
    subscriptionId: string,
    data: {
      status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED'
      planId?: string
    }
  ) {
    return this.request(`/admin/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ============================================
  // Admin - Stats
  // ============================================
  async adminGetStats() {
    return this.request('/admin/stats')
  }
}

export const api = new APIClient(API_URL)
