export default function Integrations() {
  const integrations = [
    { name: 'WhatsApp', icon: '💬', color: 'from-green-400 to-green-600' },
    { name: 'Web Widget', icon: '🌐', color: 'from-blue-400 to-blue-600' },
    { name: 'Facebook', icon: '📘', color: 'from-blue-500 to-blue-700' },
    { name: 'Telegram', icon: '✈️', color: 'from-sky-400 to-sky-600' },
    { name: 'Instagram', icon: '📸', color: 'from-pink-400 to-purple-600' },
    { name: 'API REST', icon: '⚙️', color: 'from-gray-400 to-gray-600' },
  ]

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-gradient">Integraciones Perfectas</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Conecta tu chatbot con las plataformas que tus clientes ya usan
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="group relative"
            >
              <div className="glass rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 flex flex-col items-center justify-center h-40 hover:scale-110 hover:shadow-2xl">
                <div className={`text-5xl mb-3 group-hover:scale-125 transition-transform duration-300`}>
                  {integration.icon}
                </div>
                <div className="text-white font-semibold text-center">
                  {integration.name}
                </div>
                
                {/* Efecto de brillo al hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${integration.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300`} />
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje adicional */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-lg">
            ¿Necesitas otra integración? <span className="text-gradient font-semibold cursor-pointer hover:underline">Contáctanos</span>
          </p>
        </div>
      </div>
    </section>
  )
}
