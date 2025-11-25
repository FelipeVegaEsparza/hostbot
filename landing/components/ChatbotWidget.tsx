'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function ChatbotWidget() {
  useEffect(() => {
    // Verificar que el widget se haya cargado
    const checkWidget = setInterval(() => {
      if (customElements.get('chatbot-widget')) {
        console.log('✅ Chatbot widget loaded successfully')
        clearInterval(checkWidget)
      }
    }, 100)

    return () => clearInterval(checkWidget)
  }, [])

  return (
    <>
      {/* Cargar el script del widget */}
      <Script 
        src="/widget.js" 
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Widget script loaded')
        }}
      />
      
      {/* Componente del widget */}
      <chatbot-widget
        bot-id="845f8c41-01bf-4439-9880-0c8be35be8e0"
        api-url="http://localhost:3000"
        theme="light"
        position="bottom-right"
        primary-color="#3B82F6"
        welcome-message="¡Hola! ¿En qué puedo ayudarte?"
        placeholder="Escribe un mensaje..."
      />
    </>
  )
}
