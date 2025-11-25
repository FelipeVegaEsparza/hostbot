import { io, Socket } from 'socket.io-client'
import { getToken } from './auth'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

class WebSocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect() {
    if (this.socket?.connected) return

    const token = getToken()
    if (!token) return

    // Connect to the /messages namespace
    const wsUrlWithNamespace = `${WS_URL}/messages`
    console.log(`[WebSocket] Connecting to: ${wsUrlWithNamespace}`)
    
    this.socket = io(wsUrlWithNamespace, {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log(`[WebSocket] ✅ Connected to namespace /messages (socket id: ${this.socket?.id})`)
    })

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] ❌ Disconnected from namespace /messages')
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message)
    })

    this.socket.on('message', (data: any) => {
      this.emit('message', data)
    })

    this.socket.on('conversation:update', (data: any) => {
      this.emit('conversation:update', data)
    })

    this.socket.on('chatbot:update', (data: any) => {
      this.emit('chatbot:update', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      console.log(`[WebSocket] 📥 Subscribing to conversation: ${conversationId}`)
      this.socket.emit('subscribe', { conversationId })
    } else {
      console.warn('[WebSocket] Cannot join conversation - not connected')
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      console.log(`[WebSocket] 📤 Unsubscribing from conversation: ${conversationId}`)
      this.socket.emit('unsubscribe', { conversationId })
    } else {
      console.warn('[WebSocket] Cannot leave conversation - not connected')
    }
  }
}

export const ws = new WebSocketClient()
