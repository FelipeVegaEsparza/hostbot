'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from '@/components/i18n-provider'
import { useChatbots } from '@/hooks/use-chatbots'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, QrCode, RefreshCw, Power, PowerOff } from 'lucide-react'
import { WhatsAppQRSession } from '@/types'
import Image from 'next/image'
import { pollUntil } from '@/lib/whatsapp-qr-polling'

export default function WhatsAppQRPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('whatsapp.qrCode')
  const { chatbots } = useChatbots()
  const [selectedChatbot, setSelectedChatbot] = useState<string>('')
  const [session, setSession] = useState<WhatsAppQRSession | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedChatbot) {
      loadSession(selectedChatbot)
    }
  }, [selectedChatbot])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (polling && session?.sessionId) {
      interval = setInterval(() => {
        checkStatus(session.sessionId)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [polling, session])

  const loadSession = async (chatbotId: string) => {
    try {
      console.log('📥 [LOAD_SESSION] Loading session for chatbot:', chatbotId)
      const response = await api.getWhatsAppQRSession(chatbotId) as any
      console.log('📥 [LOAD_SESSION] Raw response:', response)
      console.log('📥 [LOAD_SESSION] Response type:', typeof response)
      
      // Handle response format: { success: true, data: {...} }
      const data = response.data || response
      console.log('📥 [LOAD_SESSION] Extracted data:', data)
      console.log('📥 [LOAD_SESSION] Data status:', data?.status)
      console.log('📥 [LOAD_SESSION] Has qrCode:', !!data?.qrCode)
      
      // Si no hay status, tratar como si no hubiera sesión
      if (!data || !data.status) {
        console.log('⚠️ [LOAD_SESSION] Invalid session data, treating as no session')
        setSession(null)
        setQrCode(null)
        setPolling(false)
        return
      }
      
      console.log('✅ [LOAD_SESSION] Setting session state:', data)
      setSession(data)
      
      if (data.status === 'QR_READY' && data.qrCode) {
        console.log('🎯 [LOAD_SESSION] QR_READY with qrCode, setting states...')
        console.log('🎯 [LOAD_SESSION] QR Code preview:', data.qrCode.substring(0, 50) + '...')
        setQrCode(data.qrCode)
        setPolling(true)
        console.log('✅ [LOAD_SESSION] States set: qrCode, polling=true')
      } else if (data.status === 'CONNECTED') {
        console.log('🔗 [LOAD_SESSION] Session is CONNECTED')
        setPolling(false)
      }
    } catch (error) {
      console.log('❌ [LOAD_SESSION] No session found or error:', error)
      setSession(null)
      setQrCode(null)
      setPolling(false)
    }
  }

  const pollForQRCode = async (chatbotId: string) => {
    console.log('🔄 [POLLING] Starting QR code polling for chatbot:', chatbotId)
    console.log('🔄 [POLLING] Timestamp:', new Date().toISOString())
    
    const result = await pollUntil(
      async () => {
        console.log('📡 [POLLING] Making API request to getWhatsAppQRSession...')
        const response = await api.getWhatsAppQRSession(chatbotId) as any
        console.log('📡 [POLLING] Raw response received:', response)
        console.log('📡 [POLLING] Response type:', typeof response)
        console.log('📡 [POLLING] Response keys:', Object.keys(response || {}))
        
        // Handle response format: { success: true, data: {...} }
        const data = response.data || response
        console.log('📡 [POLLING] Extracted data:', data)
        console.log('📡 [POLLING] Data status:', data?.status)
        console.log('📡 [POLLING] Has qrCode:', !!data?.qrCode)
        if (data?.qrCode) {
          console.log('📡 [POLLING] QR Code length:', data.qrCode.length)
          console.log('📡 [POLLING] QR Code preview:', data.qrCode.substring(0, 50) + '...')
        }
        
        return data
      },
      (data) => {
        console.log('🔍 [POLLING] Checking condition for data:', data)
        // QR code is available
        if (data.status === 'QR_READY' && data.qrCode) {
          console.log('✅ [POLLING] Condition met: QR_READY with qrCode')
          return true
        }
        // Already connected
        if (data.status === 'CONNECTED') {
          console.log('✅ [POLLING] Condition met: CONNECTED')
          return true
        }
        console.log('⏳ [POLLING] Condition not met, continuing polling...')
        return false
      },
      {
        maxDuration: 30000, // 30 seconds
        initialInterval: 1000, // Start at 1 second
        maxInterval: 3000, // Max 3 seconds
        backoffMultiplier: 1.5,
      }
    )

    console.log('🏁 [POLLING] Polling completed. Result:', result)
    console.log('🏁 [POLLING] Success:', result.success)
    console.log('🏁 [POLLING] Timed out:', result.timedOut)

    if (result.success && result.data) {
      console.log('✅ [POLLING] Setting session state:', result.data)
      setSession(result.data)
      
      if (result.data.status === 'QR_READY' && result.data.qrCode) {
        console.log('🎯 [POLLING] QR Code received! Setting qrCode state...')
        console.log('🎯 [POLLING] QR Code value:', result.data.qrCode.substring(0, 50) + '...')
        setQrCode(result.data.qrCode)
        setPolling(true)
        setQrLoading(false) // QR received
        console.log('✅ [POLLING] State updated: qrCode set, polling=true, qrLoading=false')
      } else if (result.data.status === 'CONNECTED') {
        console.log('🔗 [POLLING] Session connected')
        setPolling(false)
        setQrLoading(false) // Connected
        console.log('✅ [POLLING] State updated: polling=false, qrLoading=false')
      }
      return true
    }

    console.log('⏱️ [POLLING] Timeout occurred or no data')
    setQrLoading(false) // Timeout occurred
    return false
  }

  const handleInitialize = async () => {
    if (!selectedChatbot) return
    
    console.log('🚀 [INITIALIZE] Starting initialization for chatbot:', selectedChatbot)
    console.log('🚀 [INITIALIZE] Timestamp:', new Date().toISOString())
    
    setLoading(true)
    setError(null) // Clear previous errors
    setQrCode(null) // Clear previous QR code
    console.log('🚀 [INITIALIZE] States cleared: error=null, qrCode=null, loading=true')
    
    try {
      // If there's an existing session, disconnect it first
      if (session?.sessionId) {
        console.log('🔌 [INITIALIZE] Disconnecting existing session:', session.sessionId)
        try {
          await api.disconnectWhatsAppQR(session.sessionId)
          // Wait a bit for the microservice to clean up
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log('✅ [INITIALIZE] Existing session disconnected')
        } catch (error) {
          console.warn('⚠️ [INITIALIZE] Failed to disconnect existing session, continuing anyway:', error)
        }
      }
      
      console.log('📡 [INITIALIZE] Calling initWhatsAppQRSession API...')
      const response = await api.initWhatsAppQRSession(selectedChatbot) as any
      console.log('📡 [INITIALIZE] Init response:', response)
      
      // Handle response format if needed
      const sessionData = response.data || response
      console.log('📡 [INITIALIZE] Session data:', sessionData)
      setSession(sessionData)
      console.log('✅ [INITIALIZE] Session state set')
      
      // Set qrLoading to true after initialization
      setQrLoading(true)
      console.log('⏳ [INITIALIZE] qrLoading set to true, starting polling...')
      
      // Start polling for QR code
      const success = await pollForQRCode(selectedChatbot)
      console.log('🏁 [INITIALIZE] Polling finished. Success:', success)
      
      if (!success) {
        console.log('❌ [INITIALIZE] Polling failed, setting timeout error')
        setError(t('session.qrTimeout') || 'QR code generation timed out. Please try again.')
      }
    } catch (error) {
      console.error('❌ [INITIALIZE] Failed to initialize session:', error)
      setError(t('session.initializationFailed') || 'Failed to initialize session. Please try again.')
      setQrLoading(false) // Error occurred
    } finally {
      setLoading(false)
      console.log('🏁 [INITIALIZE] Initialization complete. loading=false')
    }
  }

  const loadQRCode = async (sessionId: string) => {
    try {
      setQrLoading(true)
      const response = await api.getWhatsAppQRCode(sessionId) as any
      console.log('QR Code response:', response)
      
      // Handle different response formats
      const qrCodeData = response.qrCode || response.data?.qrCode || response
      
      if (qrCodeData && typeof qrCodeData === 'string') {
        setQrCode(qrCodeData)
        setError(null)
      } else {
        console.warn('No QR code in response:', response)
        setError('No se pudo obtener el código QR. Intenta inicializar de nuevo.')
      }
    } catch (error) {
      console.error('Failed to load QR code:', error)
      setError('Error al cargar el código QR. Intenta de nuevo.')
    } finally {
      setQrLoading(false)
    }
  }

  const checkStatus = async (sessionId: string) => {
    try {
      const response = await api.getWhatsAppQRStatus(sessionId) as any
      // Handle response format if needed
      const sessionData = response.session || response.data || response
      setSession(sessionData)
      
      // Stop polling when status becomes CONNECTED
      if (sessionData.status === 'CONNECTED') {
        setPolling(false)
        setQrCode(null) // Clear QR code display
        setQrLoading(false) // Clear loading state
      } else if (sessionData.status === 'QR_READY' && sessionData.qrCode) {
        setQrCode(sessionData.qrCode)
      }
    } catch (error) {
      console.error('Failed to check status:', error)
    }
  }

  const handleDisconnect = async () => {
    if (!session?.sessionId) return
    setLoading(true)
    try {
      await api.disconnectWhatsAppQR(session.sessionId)
      setSession(null)
      setQrCode(null)
      setPolling(false)
      alert(t('session.disconnectSuccess'))
    } catch (error) {
      console.error('Failed to disconnect:', error)
      alert(t('session.disconnectError'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return 'bg-green-500'
      case 'QR_READY':
      case 'CONNECTING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${locale}/dashboard/whatsapp`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          <p className="text-muted-foreground">
            {t('pageSubtitle')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('selectChatbot.title')}</CardTitle>
          <CardDescription>
            {t('selectChatbot.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChatbot} onValueChange={setSelectedChatbot}>
            <SelectTrigger>
              <SelectValue placeholder={t('selectChatbot.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {chatbots?.map((chatbot: { id: string; name: string }) => (
                <SelectItem key={chatbot.id} value={chatbot.id}>
                  {chatbot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChatbot && (
        <>
          {session && session.status ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('session.title')}</CardTitle>
                    <CardDescription>
                      {t('session.subtitle')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(session.status)}`} />
                    <span className="text-sm font-medium">{t(`status.${session.status}`)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInitialize}
                        disabled={loading}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('common.retry')}
                      </Button>
                    </div>
                  </div>
                )}
                
                {(() => {
                  console.log('🎨 [RENDER] Evaluating render conditions:')
                  console.log('🎨 [RENDER] qrLoading:', qrLoading)
                  console.log('🎨 [RENDER] qrCode:', qrCode ? `${qrCode.substring(0, 50)}...` : 'null')
                  console.log('🎨 [RENDER] error:', error)
                  console.log('🎨 [RENDER] session.status:', session.status)
                  console.log('🎨 [RENDER] Show loading?', qrLoading && !qrCode && !error)
                  console.log('🎨 [RENDER] Show QR?', session.status === 'QR_READY' && qrCode)
                  return null
                })()}
                
                {qrLoading && !qrCode && !error && (
                  <div className="flex flex-col items-center space-y-4 py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">
                      {t('session.generatingQR') || 'Generating QR code...'}
                    </p>
                  </div>
                )}
                
                {session.status === 'QR_READY' && qrCode && (() => {
                  console.log('✅ [RENDER] Rendering QR Code Image!')
                  console.log('✅ [RENDER] QR Code src:', qrCode.substring(0, 50) + '...')
                  return null
                })() && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <Image
                        src={qrCode}
                        alt="WhatsApp QR Code"
                        width={256}
                        height={256}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      {t('session.scanPrompt')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => session.sessionId && loadQRCode(session.sessionId)}
                      disabled={qrLoading}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${qrLoading ? 'animate-spin' : ''}`} />
                      {qrLoading ? 'Actualizando...' : (t('session.refresh') || 'Actualizar Código QR')}
                    </Button>
                  </div>
                )}

                {session.status === 'CONNECTED' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Power className="h-6 w-6" />
                      <span className="text-lg font-semibold">{t('status.CONNECTED')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('session.connectedMessage')}
                    </p>
                    {session.lastConnectedAt && (
                      <p className="text-xs text-muted-foreground">
                        {t('session.lastConnected')} {new Date(session.lastConnectedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {session.status === 'DISCONNECTED' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <PowerOff className="h-6 w-6" />
                      <span className="text-lg font-semibold">{t('status.DISCONNECTED')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('session.disconnectedMessage')}
                    </p>
                    <Button onClick={handleInitialize} disabled={loading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {loading ? t('session.initializing') : t('session.reconnect')}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  {session.status === 'DISCONNECTED' && (
                    <Button onClick={handleInitialize} disabled={loading} className="flex-1">
                      <QrCode className="mr-2 h-4 w-4" />
                      {loading ? t('session.initializing') : t('session.reconnect')}
                    </Button>
                  )}
                  {(session.status === 'CONNECTED' || session.status === 'QR_READY') && (
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={loading}
                      className="flex-1"
                    >
                      <PowerOff className="mr-2 h-4 w-4" />
                      {loading ? t('session.disconnecting') : t('session.disconnect')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('session.noActive')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('session.noActiveDescription')}
                </p>
                <Button onClick={handleInitialize} disabled={loading}>
                  <QrCode className="mr-2 h-4 w-4" />
                  {loading ? t('session.initializing') : t('session.initialize')}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
