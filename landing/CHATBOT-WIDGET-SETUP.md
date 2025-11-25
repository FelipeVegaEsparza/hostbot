# 🤖 Chatbot Widget - Configuración en Landing

## ✅ Implementación Completada

El widget de chatbot ha sido implementado exitosamente en el landing page.

---

## 📁 Archivos Agregados

### 1. `/public/widget.js`
- Script del widget (12.70 KB)
- Copiado desde `widget/dist/widget.js`
- Servido estáticamente por Next.js

### 2. `/components/ChatbotWidget.tsx`
- Componente React que carga el widget
- Usa `next/script` para carga optimizada
- Configuración del widget con atributos

### 3. `/types/chatbot-widget.d.ts`
- Declaraciones de tipos TypeScript
- Define el custom element `<chatbot-widget>`
- Proporciona autocompletado en el IDE

### 4. `/app/layout.tsx` (modificado)
- Importa y renderiza `<ChatbotWidget />`
- Widget disponible en todas las páginas del landing

---

## 🎯 Configuración Actual

```tsx
<chatbot-widget
  bot-id="845f8c41-01bf-4439-9880-0c8be35be8e0"
  api-url="http://localhost:3000"
  theme="light"
  position="bottom-right"
  primary-color="#3B82F6"
  welcome-message="¡Hola! ¿En qué puedo ayudarte?"
  placeholder="Escribe un mensaje..."
/>
```

### Parámetros Configurados:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `bot-id` | `845f8c41-01bf-4439-9880-0c8be35be8e0` | ID del chatbot de Hostreams |
| `api-url` | `http://localhost:3000` | URL del backend API |
| `theme` | `light` | Tema claro |
| `position` | `bottom-right` | Esquina inferior derecha |
| `primary-color` | `#3B82F6` | Azul (color principal) |
| `welcome-message` | `¡Hola! ¿En qué puedo ayudarte?` | Mensaje de bienvenida |
| `placeholder` | `Escribe un mensaje...` | Placeholder del input |

---

## 🚀 Cómo Probar

### 1. Iniciar el backend (si no está corriendo):

```bash
cd backend
npm run dev
```

### 2. Iniciar el landing:

```bash
cd landing
npm run dev
```

### 3. Abrir en el navegador:

```
http://localhost:3000
```

### 4. Verificar el widget:

- Deberías ver un botón flotante 💬 en la esquina inferior derecha
- Haz clic para abrir el chat
- Escribe un mensaje y envíalo
- Verás una respuesta simulada (hasta que se implemente WebSocket)

---

## 🎨 Personalización

### Cambiar el Color Principal

Edita `landing/components/ChatbotWidget.tsx`:

```tsx
<chatbot-widget
  primary-color="#10B981"  // Verde
  // ... otros atributos
/>
```

### Cambiar la Posición

```tsx
<chatbot-widget
  position="bottom-left"  // Esquina inferior izquierda
  // ... otros atributos
/>
```

Opciones: `bottom-right`, `bottom-left`, `top-right`, `top-left`

### Cambiar al Tema Oscuro

```tsx
<chatbot-widget
  theme="dark"
  // ... otros atributos
/>
```

### Cambiar Mensajes

```tsx
<chatbot-widget
  welcome-message="¡Bienvenido! Estoy aquí para ayudarte 24/7"
  placeholder="Pregúntame lo que quieras..."
  // ... otros atributos
/>
```

---

## 🔧 Actualizar el Widget

Cuando hagas cambios en el código del widget:

### 1. Reconstruir el widget:

```bash
cd widget
npm run build:widget
```

### 2. Copiar el nuevo widget.js al landing:

```bash
# Desde la carpeta widget
Copy-Item dist/widget.js ../landing/public/widget.js

# O en Linux/Mac
cp dist/widget.js ../landing/public/widget.js
```

### 3. Reiniciar el servidor del landing:

```bash
cd landing
# Detener el servidor (Ctrl+C)
npm run dev
```

---

## 📱 Responsive

El widget es completamente responsive:

- **Desktop**: Ventana flotante de 380x600px
- **Mobile**: Pantalla completa optimizada para touch

---

## 🔒 Seguridad

### CORS

El backend debe permitir requests desde el dominio del landing:

```typescript
// backend/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',  // Landing en desarrollo
    'https://tudominio.com',  // Landing en producción
  ],
  credentials: true,
});
```

---

## 🌐 Despliegue a Producción

### 1. Actualizar la URL del API:

Edita `landing/components/ChatbotWidget.tsx`:

```tsx
<chatbot-widget
  api-url="https://api.tudominio.com"  // URL de producción
  // ... otros atributos
/>
```

### 2. Opción A: Servir widget.js desde el landing

Ya está configurado. El archivo `public/widget.js` se servirá automáticamente.

### 2. Opción B: Servir widget.js desde CDN

Si prefieres usar un CDN:

```tsx
<Script 
  src="https://cdn.tudominio.com/widget.js"  // URL del CDN
  strategy="lazyOnload"
/>
```

### 3. Desplegar el landing:

```bash
cd landing
npm run build
npm start
```

O usar Vercel/Netlify para despliegue automático.

---

## 🐛 Troubleshooting

### El widget no aparece

1. Abre la consola del navegador (F12)
2. Busca errores en rojo
3. Verifica que `widget.js` se cargó correctamente:
   - Ve a la pestaña "Network"
   - Busca `widget.js`
   - Debe tener status 200

### El widget aparece pero no funciona

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Verifica CORS en el backend
3. Revisa la consola del navegador para errores de API

### Errores de TypeScript

Si ves errores de tipos, asegúrate de que existe:
- `landing/types/chatbot-widget.d.ts`

---

## 📊 Estado Actual

| Componente | Estado | Notas |
|------------|--------|-------|
| Widget instalado | ✅ | Funcionando |
| Carga del script | ✅ | Optimizado con Next.js Script |
| Tipos TypeScript | ✅ | Declaraciones agregadas |
| Responsive | ✅ | Mobile y desktop |
| Personalización | ✅ | Colores, tema, posición |
| Integración backend | ⚠️ | Respuestas simuladas (falta WebSocket) |

---

## 🎯 Próximos Pasos

1. **Implementar WebSocket** en el backend para respuestas reales del AI
2. **Configurar CORS** para el dominio de producción
3. **Actualizar api-url** cuando despliegues a producción
4. **Personalizar colores** para que coincidan con tu marca

---

## 📞 Soporte

Si tienes problemas con el widget:
1. Revisa la documentación en `widget/README.md`
2. Revisa la revisión completa en `widget/WIDGET-REVIEW.md`
3. Verifica los logs en la consola del navegador

