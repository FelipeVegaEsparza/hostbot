'use client'

export default function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '29',
      description: 'Perfecto para empezar',
      features: [
        '1 Chatbot',
        '1,000 mensajes/mes',
        'GPT-4o-mini',
        'Widget Web',
        'Soporte por email'
      ],
      popular: false,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Professional',
      price: '99',
      description: 'Para negocios en crecimiento',
      features: [
        '5 Chatbots',
        '10,000 mensajes/mes',
        'GPT-4, Claude, Gemini',
        'WhatsApp + Web Widget',
        'Base de conocimiento',
        'Analytics avanzado',
        'Soporte prioritario'
      ],
      popular: true,
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Enterprise',
      price: '299',
      description: 'Para empresas grandes',
      features: [
        'Chatbots ilimitados',
        '100,000 mensajes/mes',
        'Todos los modelos de IA',
        'Todas las integraciones',
        'API personalizada',
        'Soporte 24/7',
        'Gerente de cuenta dedicado'
      ],
      popular: false,
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <section id="pricing" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Precios Transparentes</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Sin costos ocultos. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.popular ? 'md:-mt-8' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full">
                  ⭐ Más Popular
                </div>
              )}

              <div className={`glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 h-full ${
                plan.popular ? 'border-2 border-purple-500 shadow-2xl scale-105' : ''
              } group-hover:scale-105 group-hover:shadow-2xl`}>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gradient">${plan.price}</span>
                    <span className="text-gray-400 ml-2">/mes</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-2xl hover:scale-105 glow'
                    : 'glass text-white hover:bg-white/20'
                }`}>
                  Comenzar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400">
            ¿Necesitas un plan personalizado? <span className="text-gradient font-semibold cursor-pointer hover:underline">Habla con ventas</span>
          </p>
        </div>
      </div>
    </section>
  )
}
