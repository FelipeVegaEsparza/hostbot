# 🎯 Configuración Rápida del Favicon

## ✅ Ya Está Configurado

El favicon ya está configurado en ambas aplicaciones. Solo necesitas agregar tu archivo.

## 📍 Ubicación

Coloca tu archivo `favicon.png` en:

```
dashboard/public/favicon.png
landing/public/favicon.png
```

## 📐 Especificaciones

- **Tamaño**: 32x32px o 64x64px
- **Formato**: PNG
- **Peso**: < 10KB
- **Nombre**: `favicon.png` (minúsculas)

## 🚀 Pasos

1. Crea o redimensiona tu favicon a 64x64px
2. Guárdalo como `favicon.png`
3. Cópialo a ambas carpetas public
4. Reinicia los servidores
5. Limpia el cache del navegador (Ctrl+Shift+R)

## 🎨 Crear Favicon Rápido

### Desde tu Logo
```
1. Abre tu logo en un editor
2. Redimensiona a 64x64px
3. Guarda como PNG
4. Nómbralo favicon.png
```

### Herramientas Online
- **Favicon.io** - Gratis y fácil
- **RealFaviconGenerator** - Completo
- **Canva** - Diseño desde cero

## 🔍 Verificar

Después de agregar el favicon:
1. Abre http://localhost:3001 (Dashboard)
2. Abre http://localhost:3000 (Landing)
3. Mira la pestaña del navegador
4. Deberías ver tu favicon junto al título

## ⚠️ Si No Aparece

1. Verifica el nombre: `favicon.png` (minúsculas)
2. Verifica la ubicación: `public/favicon.png`
3. Reinicia el servidor (Ctrl+C, luego npm run dev)
4. Limpia el cache: Ctrl+Shift+R
5. Prueba en modo incógnito

## 📝 Archivos Modificados

✅ `dashboard/app/[locale]/layout.tsx` - Configurado
✅ `landing/app/layout.tsx` - Configurado

## 📚 Más Información

Ver `FAVICON_SETUP_GUIDE.md` para guía completa.

---

**Resumen**: Coloca `favicon.png` (64x64px) en las carpetas public y reinicia los servidores.
