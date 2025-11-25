'use client'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'María González',
      role: 'CEO, TechStart',
      image: '👩‍💼',
      text: 'Increíble cómo ha mejorado nuestra atención al cliente. Respondemos 10x más rápido y nuestros clientes están más satisfechos.',
      rating: 5
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Director de Marketing, EcomPlus',
      image: '👨‍💼',
      text: 'La integración con WhatsApp fue perfecta. Ahora atendemos a miles de clientes sin aumentar nuestro equipo.',
      rating: 5
    },
    {
      name: 'Ana Martínez',
      role: 'Fundadora, BeautyShop',
      image: '👩‍🦰',
      text: 'El ROI fue inmediato. Recuperamos la inversión en el primer mes. Altamente recomendado.',
      rating: 5
    }
  ]

  return (
    <section id="testimonials" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Lo que Dicen Nuestros Clientes</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Más de 500 empresas confían en nosotros
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Estrellas */}
              <div className="flex space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>

              {/* Texto */}
              <p className="text-gray-300 mb-6 leading-relaxed italic">
                "{testimonial.text}"
              </p>

              {/* Autor */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.image}
                </div>
                <div>
                  <div className="text-white font-semibold">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
