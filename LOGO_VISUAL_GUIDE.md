# 🎨 Guía Visual: Dónde Agregar tu Logo

## 📂 Estructura de Carpetas

```
chatbot/
│
├── dashboard/
│   ├── public/              ← CARPETA CREADA ✅
│   │   ├── logo.png         ← COLOCA TU LOGO AQUÍ 📍
│   │   └── PLACE_YOUR_LOGO_HERE.txt
│   │
│   └── components/
│       └── dashboard-nav.tsx  ← YA MODIFICADO ✅
│
└── landing/
    ├── public/              ← CARPETA EXISTENTE ✅
    │   ├── logo.png         ← COLOCA TU LOGO AQUÍ 📍
    │   └── PLACE_YOUR_LOGO_HERE.txt
    │
    └── components/
        ├── Navbar.tsx       ← NECESITA ACTUALIZACIÓN ⚠️
        └── Footer.tsx       ← NECESITA ACTUALIZACIÓN ⚠️
```

## 🎯 Ubicaciones del Logo en la UI

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD (Panel de Control)                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │              │  │                                 │  │
│  │  [TU LOGO]   │  │  Contenido Principal           │  │
│  │   ← AQUÍ     │  │                                 │  │
│  │              │  │                                 │  │
│  │──────────────│  │                                 │  │
│  │ 🌐 Español   │  │                                 │  │
│  │──────────────│  │                                 │  │
│  │ Panel        │  │                                 │  │
│  │ Chatbots     │  │                                 │  │
│  │ Conversac.   │  │                                 │  │
│  │ Base Conoc.  │  │                                 │  │
│  │ WhatsApp     │  │                                 │  │
│  │ Facturación  │  │                                 │  │
│  │ Config.      │  │                                 │  │
│  │              │  │                                 │  │
│  └──────────────┘  └────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  LANDING PAGE (Página Principal)                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [TU LOGO] ← AQUÍ    Inicio  Features  Pricing    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │         Hero Section                                │ │
│  │         Features                                    │ │
│  │         Pricing                                     │ │
│  │         ...                                         │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  [TU LOGO] ← AQUÍ                                  │ │
│  │                                                     │ │
│  │  Footer con enlaces y redes sociales               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📏 Especificaciones del Logo

```
┌─────────────────────────────────────┐
│                                     │
│         TU LOGO AQUÍ                │  ← Alto: 40-60px
│                                     │
└─────────────────────────────────────┘
         ↑
    Ancho: 150-200px
```

### Formato Ideal
```
Archivo: logo.png
Formato: PNG con transparencia
Tamaño: 150x40px (o proporcional)
Peso: < 50KB (optimizado)
Fondo: Transparente
```

## 🎨 Ejemplos de Logos

### ✅ BUENO - Logo Horizontal
```
┌──────────────────────────┐
│  🏢 MI EMPRESA           │  ← Perfecto para navbar
└──────────────────────────┘
```

### ✅ BUENO - Logo con Icono + Texto
```
┌──────────────────────────┐
│  [🎯] MI EMPRESA         │  ← Ideal
└──────────────────────────┘
```

### ⚠️ REGULAR - Logo Cuadrado
```
┌──────┐
│  🏢  │  ← Funciona pero ocupa más espacio
│  MI  │
└──────┘
```

### ❌ MALO - Logo Vertical
```
┌──────┐
│  MI  │  ← Muy alto, no recomendado
│ EMP  │
│ RESA │
└──────┘
```

## 🔧 Estado Actual de Implementación

### ✅ COMPLETADO

```
dashboard/components/dashboard-nav.tsx
├── ✅ Import de Image agregado
├── ✅ Código del logo implementado
├── ✅ Fallback al texto configurado
└── ✅ Estilos y hover effects
```

### ⚠️ PENDIENTE (Opcional)

```
landing/components/Navbar.tsx
└── ⚠️ Necesita reemplazar icono por logo

landing/components/Footer.tsx
└── ⚠️ Necesita reemplazar icono por logo
```

## 📝 Checklist de Implementación

### Paso 1: Preparar el Logo
- [ ] Tienes tu logo en formato PNG
- [ ] El logo tiene fondo transparente
- [ ] El logo mide aproximadamente 150-200px de ancho
- [ ] El archivo pesa menos de 100KB

### Paso 2: Colocar el Logo
- [ ] Copiar logo a `dashboard/public/logo.png`
- [ ] Copiar logo a `landing/public/logo.png`
- [ ] Verificar que el nombre sea exactamente `logo.png`

### Paso 3: Verificar Dashboard
- [ ] Abrir http://localhost:3001
- [ ] Ver el logo en el sidebar izquierdo
- [ ] Verificar que se ve bien
- [ ] Probar el hover effect

### Paso 4: Actualizar Landing (Opcional)
- [ ] Modificar `landing/components/Navbar.tsx`
- [ ] Modificar `landing/components/Footer.tsx`
- [ ] Abrir http://localhost:3000
- [ ] Verificar que se ve bien

## 🎯 Código Actual en Dashboard

```tsx
// dashboard/components/dashboard-nav.tsx (líneas 56-66)

<div className="p-6 border-b">
  <Link href={`/${locale}/dashboard`} className="block">
    {/* Tu logo personalizado */}
    <img 
      src="/logo.png" 
      alt={t('appTitle')} 
      className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
    />
    
    {/* Fallback al texto (comentado) */}
    {/* <h1 className="text-2xl font-bold ...">
      {t('appTitle')}
    </h1> */}
  </Link>
</div>
```

## 🚀 Siguiente Paso

**AHORA MISMO:**
1. Guarda tu logo como `logo.png`
2. Cópialo a `dashboard/public/logo.png`
3. Cópialo a `landing/public/logo.png`
4. Reinicia los servidores
5. ¡Listo! 🎉

**OPCIONAL (DESPUÉS):**
- Actualizar Navbar de la landing
- Actualizar Footer de la landing
- Agregar favicon
- Crear versiones responsive

---

**📍 Ubicación Exacta de tus Logos:**
- `F:\chatbot\dashboard\public\logo.png`
- `F:\chatbot\landing\public\logo.png`
