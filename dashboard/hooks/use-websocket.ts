import { useEffect, useCallback } from 'react'
import { ws } from '@/lib/websocket'

export function useWebSocket() {
  useEffect(() => {
    ws.connect()
    return () => {
      ws.disconnect()
    }
  }, [])

  const on = useCallback((event: string, callback: Function) => {
    ws.on(event, callback)
    return () => ws.off(event, callback)
  }, [])

  const joinConversation = useCallback((conversationId: string) => {
    ws.joinConversation(conversationId)
  }, [])

  const leaveConversation = useCallback((conversationId: string) => {
    ws.leaveConversation(conversationId)
  }, [])

  return {
    on,
    joinConversation,
    leaveConversation,
  }
}
