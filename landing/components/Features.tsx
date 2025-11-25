'use client'

export default function Features() {
  const features = [
    {
      icon: '🤖',
      title: 'IA Avanzada',
      description: 'Potenciado por GPT-4, Claude y más modelos de IA de última generación',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '💬',
      title: 'Multi-Canal',
      description: 'WhatsApp, Web Widget, Facebook Messenger y más plataformas',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📚',
      title: 'Base de Conocimiento',
      description: 'Entrena tu chatbot con documentos, PDFs y tu contenido personalizado',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '⚡',
      title: 'Respuestas Instantáneas',
      description: 'Tiempo de respuesta menor a 2 segundos en promedio',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🔒',
      title: 'Seguro y Privado',
      description: 'Encriptación end-to-end y cumplimiento con GDPR',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: '📊',
      title: 'Analytics Avanzado',
      description: 'Métricas detalladas y reportes de conversaciones en tiempo real',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Características Poderosas</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Todo lo que necesitas para automatizar tu atención al cliente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                   style={{ background: `linear-gradient(to right, ${feature.color})` }} />
              
              <div className="relative glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 h-full">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"
                     style={{ background: `linear-gradient(to right, ${feature.color})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
