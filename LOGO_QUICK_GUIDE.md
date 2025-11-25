# 🎨 Guía Rápida: Cómo Agregar tu Logo

## 📍 Paso 1: Coloca tu Logo

### Dashboard
```
dashboard/public/logo.png  ← Coloca tu logo aquí
```

### Landing Page
```
landing/public/logo.png  ← Coloca tu logo aquí
```

## ✅ Paso 2: Ya está Configurado

El código ya está listo para usar tu logo. Solo necesitas:

1. **Guardar tu archivo de logo** como `logo.png` en las carpetas indicadas
2. **Reiniciar el servidor** (si está corriendo)
3. **Refrescar el navegador** (Ctrl+Shift+R)

## 🎯 Ubicaciones donde Aparecerá tu Logo

### Dashboard (Panel de Control)
- ✅ **Sidebar izquierdo** - Ya configurado
- Archivo: `dashboard/components/dashboard-nav.tsx` (línea 56-66)

### Landing Page
- ⚠️ **Navbar** - Necesita actualización
- ⚠️ **Footer** - Necesita actualización

## 🔧 Si Quieres Actualizar la Landing Page

### Navbar (Barra Superior)
**Archivo**: `landing/components/Navbar.tsx`

Busca alrededor de la línea 40 y reemplaza:
```tsx
// ANTES:
<div className="flex items-center gap-2">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <MessageSquare className="w-6 h-6 text-white" />
  </div>
  <span className="text-2xl font-bold text-white">ChatBot AI</span>
</div>

// DESPUÉS:
<img 
  src="/logo.png" 
  alt="Logo" 
  className="h-10 w-auto object-contain"
/>
```

### Footer (Pie de Página)
**Archivo**: `landing/components/Footer.tsx`

Busca alrededor de la línea 80 y reemplaza:
```tsx
// ANTES:
<div className="flex items-center gap-2 mb-4">
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <MessageSquare className="w-6 h-6 text-white" />
  </div>
  <span className="text-2xl font-bold text-white">ChatBot AI</span>
</div>

// DESPUÉS:
<img 
  src="/logo.png" 
  alt="Logo" 
  className="h-10 w-auto object-contain mb-4"
/>
```

## 📐 Especificaciones del Logo

### Dimensiones Recomendadas
- **Ancho**: 150-200px (para pantallas normales)
- **Alto**: 40-60px
- **Formato**: PNG con fondo transparente
- **Resolución**: 2x para pantallas retina (300-400px ancho)

### Ejemplos de Buenos Logos
```
✅ logo.png          (150x40px, PNG transparente)
✅ logo@2x.png       (300x80px, PNG transparente, retina)
✅ logo-dark.png     (para modo oscuro)
✅ logo-light.png    (para modo claro)
```

## 🎨 Herramientas para Crear tu Logo

Si no tienes un logo aún, puedes usar:

1. **Canva** (canva.com) - Gratis, fácil de usar
2. **LogoMakr** (logomakr.com) - Generador simple
3. **Hatchful** (hatchful.shopify.com) - De Shopify
4. **Looka** (looka.com) - Con IA
5. **Figma** (figma.com) - Profesional

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

## 🔍 Verificación

Después de agregar tu logo, verifica:

- [ ] El archivo está en `dashboard/public/logo.png`
- [ ] El archivo está en `landing/public/logo.png`
- [ ] El nombre es exactamente `logo.png` (minúsculas)
- [ ] El servidor está corriendo
- [ ] Refrescaste el navegador (Ctrl+Shift+R)
- [ ] El logo se ve bien en el dashboard
- [ ] (Opcional) Actualizaste Navbar y Footer de la landing

## ⚠️ Problemas Comunes

### "No se ve mi logo"
1. Verifica que el archivo esté en la carpeta correcta
2. Verifica que el nombre sea exactamente `logo.png`
3. Reinicia el servidor (Ctrl+C y luego `npm run dev`)
4. Limpia el cache del navegador (Ctrl+Shift+R)

### "El logo se ve muy grande/pequeño"
Ajusta la clase `h-12` en el código:
- `h-8` = más pequeño
- `h-10` = pequeño
- `h-12` = mediano (actual)
- `h-16` = grande
- `h-20` = muy grande

### "El logo se ve pixelado"
Tu imagen es muy pequeña. Usa una imagen más grande (al menos 150px de ancho).

## 📝 Resumen

1. ✅ **Dashboard**: Ya está configurado, solo agrega `dashboard/public/logo.png`
2. ⚠️ **Landing**: Necesitas actualizar Navbar y Footer manualmente
3. 📏 **Tamaño**: 150-200px de ancho, PNG transparente
4. 🔄 **Reinicia**: Después de agregar el logo, reinicia el servidor

---

**¿Necesitas más ayuda?** Consulta `dashboard/LOGO_SETUP_GUIDE.md` para instrucciones detalladas.
