'use client'

import { useEffect, useState } from 'react'

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Fondo animado con partículas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" 
             style={{ top: '10%', left: '10%' }} />
        <div className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow" 
             style={{ top: '60%', right: '10%', animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse-slow" 
             style={{ bottom: '10%', left: '50%', animationDelay: '4s' }} />
      </div>

      {/* Efecto de cursor */}
      <div 
        className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-bold mb-6">
            <span className="text-gradient">Chatbots Inteligentes</span>
            <br />
            <span className="text-white">para tu Negocio</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Automatiza tu atención al cliente 24/7 con IA conversacional avanzada.
            Integración perfecta con WhatsApp, Web y más.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 glow">
              🚀 Comenzar Gratis
            </button>
            <button className="px-8 py-4 glass text-white rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300">
              📺 Ver Demo
            </button>
          </div>

          {/* Demo del chatbot flotante */}
          <div className="relative max-w-4xl mx-auto">
            <div className="gradient-border animate-float">
              <div className="p-8 rounded-2xl">
                <div className="glass rounded-xl p-6 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white">👤</span>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg p-3">
                      <p className="text-white">¿Cuál es el horario de atención?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center glow">
                      <span className="text-white">🤖</span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-3 border border-blue-500/30">
                      <p className="text-white">¡Hola! Nuestro horario es de Lunes a Viernes de 9:00 AM a 6:00 PM. ¿En qué más puedo ayudarte? 😊</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Respondiendo en tiempo real con IA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">10K+</div>
              <div className="text-gray-400">Conversaciones</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-gray-400">Disponibilidad</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
