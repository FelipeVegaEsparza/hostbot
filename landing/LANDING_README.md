# Landing Page - ChatBot AI SaaS

## 🎨 Descripción

Landing page moderna y espectacular para la plataforma de chatbots con IA. Diseñada con efectos visuales impresionantes, animaciones fluidas y un diseño responsive.

## ✨ Características

### Componentes Implementados

1. **Navbar** - Navegación con efecto glass y animaciones
2. **Hero** - Sección principal con gradientes animados y CTAs
3. **Features** - Características con iconos y efectos hover
4. **HowItWorks** - Proceso paso a paso con animaciones
5. **Integrations** - Integraciones con logos animados
6. **Pricing** - Planes de precios con efectos premium
7. **Testimonials** - Testimonios con carrusel
8. **CTA** - Call to action final con estadísticas
9. **Footer** - Footer completo con enlaces y newsletter

### Efectos Visuales

- ✅ Gradientes animados
- ✅ Efectos glass (glassmorphism)
- ✅ Animaciones con Framer Motion
- ✅ Efectos de hover interactivos
- ✅ Partículas flotantes
- ✅ Scrollbar personalizado
- ✅ Efectos de glow y sombras
- ✅ Transiciones suaves

## 🚀 Tecnologías

- **Next.js 16** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS v4** - Estilos utility-first
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Iniciar producción
npm start
```

## 🎯 Estructura

```
landing/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globales
├── components/
│   ├── Navbar.tsx          # Navegación
│   ├── Hero.tsx            # Sección hero
│   ├── Features.tsx        # Características
│   ├── HowItWorks.tsx      # Cómo funciona
│   ├── Integrations.tsx    # Integraciones
│   ├── Pricing.tsx         # Precios
│   ├── Testimonials.tsx    # Testimonios
│   ├── CTA.tsx             # Call to action
│   └── Footer.tsx          # Footer
└── public/                 # Recursos estáticos
```

## 🎨 Paleta de Colores

- **Primario**: Azul (#3b82f6) → Púrpura (#8b5cf6)
- **Secundario**: Rosa (#ec4899)
- **Fondo**: Slate 950 (#020617)
- **Texto**: Blanco / Gris

## 🌐 URLs

- **Desarrollo**: http://localhost:3000
- **Producción**: (Por configurar)

## 📝 Personalización

### Cambiar Colores

Edita `app/globals.css` para modificar los gradientes y colores:

```css
.text-gradient {
  background: linear-gradient(to right, rgb(96 165 250), rgb(192 132 252), rgb(244 114 182));
}
```

### Modificar Contenido

Cada componente en `components/` contiene su propio contenido. Edita directamente los archivos para cambiar textos, imágenes o enlaces.

### Agregar Secciones

1. Crea un nuevo componente en `components/`
2. Importa en `app/page.tsx`
3. Agrega en el orden deseado

## 🔧 Configuración

### Tailwind CSS v4

La configuración se hace directamente en `globals.css`:

```css
@import "tailwindcss";

@layer utilities {
  /* Tus utilidades personalizadas */
}
```

### Framer Motion

Todas las animaciones usan Framer Motion. Ejemplo:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
  {/* Contenido */}
</motion.div>
```

## 📱 Responsive

La landing es completamente responsive:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## ⚡ Performance

- ✅ Optimización de imágenes con Next.js
- ✅ Code splitting automático
- ✅ Lazy loading de componentes
- ✅ CSS optimizado con Tailwind
- ✅ Animaciones con GPU acceleration

## 🎭 Animaciones

### Tipos de Animaciones

1. **Fade In**: Aparición gradual
2. **Slide Up**: Deslizamiento desde abajo
3. **Scale**: Efecto de zoom
4. **Float**: Flotación continua
5. **Pulse**: Pulsación suave

### Configuración

```tsx
// Animación básica
initial={{ opacity: 0, y: 30 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}

// Animación con delay
transition={{ duration: 0.6, delay: 0.2 }}

// Animación hover
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

## 🐛 Troubleshooting

### Error de compilación con Tailwind

Si ves errores de clases desconocidas, asegúrate de usar la sintaxis de Tailwind v4:

```css
/* ❌ Incorrecto (v3) */
@tailwind base;
@apply from-blue-400;

/* ✅ Correcto (v4) */
@import "tailwindcss";
background: linear-gradient(...);
```

### Problemas con animaciones

Verifica que Framer Motion esté instalado:

```bash
npm install framer-motion
```

## 📄 Licencia

Este proyecto es parte del sistema ChatBot AI SaaS.

## 👥 Contribución

Para contribuir:

1. Crea una rama feature
2. Realiza tus cambios
3. Envía un pull request

## 🎉 Estado

✅ **Completado** - Todos los componentes implementados y funcionando

## 📞 Soporte

Para soporte, contacta al equipo de desarrollo.

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0
