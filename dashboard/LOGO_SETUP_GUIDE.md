# 🎨 Guía para Personalizar el Logo del Dashboard

## 📍 Ubicación de la Imagen

### Paso 1: Agregar tu Logo
Coloca tu archivo de logo en la carpeta:
```
dashboard/public/logo.png
```

### Formatos Recomendados:
- **PNG** (recomendado) - Con fondo transparente
- **SVG** - Escalable, ideal para logos
- **JPG** - Si no necesitas transparencia

### Dimensiones Recomendadas:
- **Ancho**: 150-200px
- **Alto**: 40-60px
- **Relación**: Horizontal (landscape)
- **Resolución**: 2x para pantallas retina (300-400px de ancho)

## 🔧 Archivos a Modificar

### 1. Dashboard (Sidebar)
**Archivo**: `dashboard/components/dashboard-nav.tsx`

**Líneas 56-60** - Reemplaza esto:
```tsx
<div className="p-6 border-b">
  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
    {t('appTitle')}
  </h1>
</div>
```

**Por esto**:
```tsx
<div className="p-6 border-b">
  <Link href={`/${locale}/dashboard`} className="block">
    <img 
      src="/logo.png" 
      alt="Logo" 
      className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
    />
  </Link>
</div>
```

### 2. Landing Page (Navbar)
**Archivo**: `landing/components/Navbar.tsx`

**Busca** (alrededor de la línea 40):
```tsx
<div className="flex items-center gap-2">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <MessageSquare className="w-6 h-6 text-white" />
  </div>
  <span className="text-2xl font-bold text-white">ChatBot AI</span>
</div>
```

**Reemplaza por**:
```tsx
<div className="flex items-center">
  <img 
    src="/logo.png" 
    alt="ChatBot AI" 
    className="h-10 w-auto object-contain"
  />
</div>
```

### 3. Landing Page (Footer)
**Archivo**: `landing/components/Footer.tsx`

**Busca** (alrededor de la línea 80):
```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <MessageSquare className="w-6 h-6 text-white" />
  </div>
  <span className="text-2xl font-bold text-white">ChatBot AI</span>
</div>
```

**Reemplaza por**:
```tsx
<div className="mb-4">
  <img 
    src="/logo.png" 
    alt="ChatBot AI" 
    className="h-10 w-auto object-contain"
  />
</div>
```

## 🎯 Opción Alternativa: Usar Next.js Image

Para mejor optimización, usa el componente Image de Next.js:

```tsx
import Image from 'next/image'

// En el código:
<Image 
  src="/logo.png" 
  alt="Logo" 
  width={150}
  height={40}
  className="object-contain"
  priority
/>
```

## 📱 Logo Responsive

Si quieres diferentes logos para móvil y desktop:

```tsx
<div className="flex items-center">
  {/* Logo completo para desktop */}
  <img 
    src="/logo-full.png" 
    alt="Logo" 
    className="hidden md:block h-10 w-auto"
  />
  
  {/* Logo compacto para móvil */}
  <img 
    src="/logo-icon.png" 
    alt="Logo" 
    className="block md:hidden h-8 w-auto"
  />
</div>
```

## 🎨 Variantes de Logo

Puedes tener diferentes versiones:

```
dashboard/public/
├── logo.png              # Logo principal
├── logo-dark.png         # Para modo oscuro
├── logo-light.png        # Para modo claro
├── logo-icon.png         # Solo icono (móvil)
└── favicon.ico           # Favicon del navegador
```

## 🔄 Favicon

Para cambiar el favicon del navegador:

### Dashboard
**Archivo**: `dashboard/app/[locale]/layout.tsx`

Agrega en el metadata:
```tsx
export const metadata: Metadata = {
  title: "Tu SaaS",
  description: "Descripción",
  icons: {
    icon: '/favicon.ico',
  }
}
```

### Landing
**Archivo**: `landing/app/layout.tsx`

Agrega en el metadata:
```tsx
export const metadata: Metadata = {
  title: "Tu SaaS",
  description: "Descripción",
  icons: {
    icon: '/favicon.ico',
  }
}
```

## 🎨 Estilos Personalizados

### Logo con Efecto Hover
```tsx
<img 
  src="/logo.png" 
  alt="Logo" 
  className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-200 cursor-pointer"
/>
```

### Logo con Sombra
```tsx
<img 
  src="/logo.png" 
  alt="Logo" 
  className="h-12 w-auto object-contain drop-shadow-lg"
/>
```

### Logo con Brillo
```tsx
<img 
  src="/logo.png" 
  alt="Logo" 
  className="h-12 w-auto object-contain hover:brightness-110 transition-all"
/>
```

## ✅ Checklist

- [ ] Crear carpeta `dashboard/public/` (si no existe)
- [ ] Crear carpeta `landing/public/` (si no existe)
- [ ] Agregar `logo.png` en ambas carpetas public
- [ ] Modificar `dashboard/components/dashboard-nav.tsx`
- [ ] Modificar `landing/components/Navbar.tsx`
- [ ] Modificar `landing/components/Footer.tsx`
- [ ] (Opcional) Agregar `favicon.ico`
- [ ] (Opcional) Agregar versiones responsive
- [ ] Probar en navegador

## 🚀 Comandos para Probar

```bash
# Dashboard
cd dashboard
npm run dev
# Abre: http://localhost:3001

# Landing
cd landing
npm run dev
# Abre: http://localhost:3000
```

## 📝 Notas Importantes

1. **Nombres de archivo**: Usa nombres simples sin espacios (logo.png, no "mi logo.png")
2. **Tamaño**: Optimiza las imágenes antes de subirlas (usa TinyPNG o similar)
3. **Formato**: PNG con transparencia es ideal para logos
4. **Cache**: Si cambias el logo y no se actualiza, limpia el cache del navegador (Ctrl+Shift+R)
5. **Producción**: Los archivos en `/public` se sirven directamente desde la raíz

## 🎯 Ejemplo Completo

Si tu logo se llama `mi-empresa-logo.png`:

```tsx
// dashboard/components/dashboard-nav.tsx
<div className="p-6 border-b">
  <Link href={`/${locale}/dashboard`}>
    <img 
      src="/mi-empresa-logo.png" 
      alt="Mi Empresa" 
      className="h-12 w-auto object-contain hover:opacity-90 transition-opacity"
    />
  </Link>
</div>
```

---

**¿Necesitas ayuda?** Si tienes problemas, verifica:
1. Que el archivo esté en la carpeta correcta
2. Que el nombre del archivo coincida exactamente
3. Que el servidor esté corriendo
4. Que hayas guardado los cambios en los archivos
