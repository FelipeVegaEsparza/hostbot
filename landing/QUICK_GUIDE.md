# 🚀 Guía Rápida - Landing Page

## Inicio Rápido

```bash
cd landing
npm install
npm run dev
```

Abre http://localhost:3000 en tu navegador.

## 📋 Checklist de Componentes

- ✅ Navbar - Navegación principal
- ✅ Hero - Sección principal con CTA
- ✅ Features - Características del producto
- ✅ HowItWorks - Proceso de uso
- ✅ Integrations - Integraciones disponibles
- ✅ Pricing - Planes y precios
- ✅ Testimonials - Testimonios de clientes
- ✅ CTA - Call to action final
- ✅ Footer - Footer con enlaces

## 🎨 Efectos Implementados

### Glassmorphism
```tsx
className="glass" // bg-white/10 backdrop-blur-lg border border-white/20
```

### Gradientes de Texto
```tsx
className="text-gradient" // Gradiente azul → púrpura → rosa
```

### Animaciones Framer Motion
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
```

### Efectos Hover
```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

## 🔧 Personalización Rápida

### Cambiar Colores Principales

Edita `app/globals.css`:

```css
.text-gradient {
  background: linear-gradient(to right, 
    rgb(96 165 250),   /* Azul */
    rgb(192 132 252),  /* Púrpura */
    rgb(244 114 182)   /* Rosa */
  );
}
```

### Modificar Textos

Cada componente tiene su contenido. Ejemplo en `Hero.tsx`:

```tsx
<h1>Tu Título Aquí</h1>
<p>Tu descripción aquí</p>
```

### Agregar Nueva Sección

1. Crea `components/NuevaSeccion.tsx`
2. Importa en `app/page.tsx`
3. Agrega: `<NuevaSeccion />`

## 📱 Breakpoints Responsive

```tsx
// Mobile first
className="text-2xl md:text-4xl lg:text-6xl"

// Grid responsive
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Flex responsive
className="flex-col md:flex-row"
```

## 🎯 Componentes Clave

### Botón Principal
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
>
  Texto del Botón
</motion.button>
```

### Card con Glass Effect
```tsx
<motion.div
  whileHover={{ y: -10 }}
  className="glass rounded-2xl p-8"
>
  {/* Contenido */}
</motion.div>
```

### Sección con Fondo Animado
```tsx
<section className="relative py-24 overflow-hidden">
  {/* Efectos de fondo */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
  
  {/* Luces animadas */}
  <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" />
  
  {/* Contenido */}
  <div className="container mx-auto px-4 relative z-10">
    {/* Tu contenido aquí */}
  </div>
</section>
```

## 🎨 Utilidades CSS Personalizadas

### Disponibles en `globals.css`

- `.text-gradient` - Gradiente de texto
- `.glass` - Efecto glassmorphism
- `.glow` - Efecto de brillo
- `.animate-float` - Animación flotante
- `.animate-pulse-slow` - Pulsación lenta
- `.gradient-border` - Borde con gradiente

## 📦 Dependencias Principales

```json
{
  "next": "16.0.3",
  "react": "19.2.0",
  "framer-motion": "^11.11.17",
  "lucide-react": "^0.460.0",
  "tailwindcss": "^4"
}
```

## 🔍 Debugging

### Ver errores de compilación
```bash
npm run build
```

### Limpiar cache
```bash
rm -rf .next
npm run dev
```

### Verificar tipos TypeScript
```bash
npx tsc --noEmit
```

## 🌟 Tips de Performance

1. **Imágenes**: Usa `next/image` para optimización automática
2. **Lazy Loading**: Los componentes se cargan bajo demanda
3. **Code Splitting**: Next.js lo hace automáticamente
4. **CSS**: Tailwind purga clases no usadas en producción

## 🎭 Animaciones Comunes

### Fade In desde abajo
```tsx
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
```

### Escala con hover
```tsx
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
transition={{ duration: 0.2 }}
```

### Stagger (secuencial)
```tsx
{items.map((item, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    {item}
  </motion.div>
))}
```

## 🚨 Errores Comunes

### "Cannot apply unknown utility class"
- **Causa**: Sintaxis de Tailwind v3 en v4
- **Solución**: Usa CSS directo en lugar de `@apply`

### "Module not found: framer-motion"
- **Causa**: Dependencia no instalada
- **Solución**: `npm install framer-motion`

### Animaciones no funcionan
- **Causa**: Falta 'use client' en componente
- **Solución**: Agrega `'use client'` al inicio del archivo

## 📝 Checklist Pre-Deploy

- [ ] `npm run build` sin errores
- [ ] Todas las imágenes optimizadas
- [ ] Links funcionando correctamente
- [ ] Responsive en mobile/tablet/desktop
- [ ] Performance > 90 en Lighthouse
- [ ] SEO metadata configurado
- [ ] Analytics configurado (si aplica)

## 🎉 ¡Listo!

Tu landing page está completa y lista para usar. Para más detalles, consulta `LANDING_README.md`.

---

**Acceso rápido**: http://localhost:3000
