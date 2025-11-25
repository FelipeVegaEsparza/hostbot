'use client'

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Crea tu Chatbot',
      description: 'Configura tu chatbot en minutos. Elige el modelo de IA y personaliza la personalidad.',
      icon: '🎨'
    },
    {
      number: '02',
      title: 'Entrena con tu Contenido',
      description: 'Sube documentos, FAQs o conecta tu base de conocimiento existente.',
      icon: '📚'
    },
    {
      number: '03',
      title: 'Integra en tus Canales',
      description: 'Conecta con WhatsApp, tu sitio web o cualquier plataforma en un clic.',
      icon: '🔗'
    },
    {
      number: '04',
      title: 'Automatiza y Escala',
      description: 'Deja que la IA maneje miles de conversaciones simultáneas 24/7.',
      icon: '🚀'
    }
  ]

  return (
    <section id="how-it-works" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Cómo Funciona</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comienza en 4 simples pasos
          </p>
        </div>

        <div className="relative">
          {/* Línea conectora */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 h-full group">
                  {/* Número */}
                  <div className="text-6xl font-bold text-gradient mb-4 group-hover:scale-110 transition-transform">
                    {step.number}
                  </div>

                  {/* Icono */}
                  <div className="text-5xl mb-4 group-hover:animate-bounce">
                    {step.icon}
                  </div>

                  {/* Título */}
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {step.title}
                  </h3>

                  {/* Descripción */}
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Flecha conectora en móvil */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <div className="text-4xl text-purple-500">↓</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 glow">
            Comenzar Ahora →
          </button>
        </div>
      </div>
    </section>
  )
}
