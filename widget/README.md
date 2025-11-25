# Widget - Chatbot Embebible

Widget de chat embebible construido con Astro y Web Components que permite integrar chatbots en cualquier sitio web.

## 🎯 Características

- **Web Component**: Funciona en cualquier framework o sitio estático
- **Shadow DOM**: Estilos aislados que no interfieren con el sitio
- **Personalizable**: Colores, posición y tema configurables
- **Responsive**: Se adapta a móviles y desktop
- **Ligero**: Bundle optimizado < 50KB
- **Sin Dependencias**: No requiere React, Vue o Angular

## 🚀 Inicio Rápido

### Para Desarrolladores del Widget

#### Requisitos

- Node.js 18+

#### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar .env
```

#### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:4321
```

#### Build

```bash
# Build de producción
npm run build

# Preview del build
npm run preview
```

### Para Usuarios del Widget

#### Instalación en Sitio Web

1. Agregar el script del widget:

```html
<script src="https://cdn.tudominio.com/widget.js"></script>
```

2. Insertar el componente:

```html
<chatbot-widget 
  bot-id="tu-chatbot-uuid"
  api-url="https://api.tudominio.com"
  theme="light"
  primary-color="#3B82F6"
  position="bottom-right">
</chatbot-widget>
```

#### Configuración

**Atributos disponibles:**

- `bot-id` (requerido): UUID del chatbot
- `api-url` (requerido): URL del API backend
- `theme`: `light` o `dark` (default: `light`)
- `primary-color`: Color principal en hex (default: `#3B82F6`)
- `position`: `bottom-right`, `bottom-left`, `top-right`, `top-left` (default: `bottom-right`)
- `welcome-message`: Mensaje de bienvenida personalizado
- `placeholder`: Placeholder del input (default: "Escribe un mensaje...")

#### Ejemplos

**Básico:**
```html
<chatbot-widget 
  bot-id="abc-123"
  api-url="https://api.example.com">
</chatbot-widget>
```

**Personalizado:**
```html
<chatbot-widget 
  bot-id="abc-123"
  api-url="https://api.example.com"
  theme="dark"
  primary-color="#10B981"
  position="bottom-left"
  welcome-message="¡Hola! ¿En qué puedo ayudarte?"
  placeholder="Pregúntame algo...">
</chatbot-widget>
```

**Con JavaScript:**
```html
<div id="chat-container"></div>

<script>
  const widget = document.createElement('chatbot-widget');
  widget.setAttribute('bot-id', 'abc-123');
  widget.setAttribute('api-url', 'https://api.example.com');
  widget.setAttribute('theme', 'light');
  document.getElementById('chat-container').appendChild(widget);
</script>
```

## 📁 Estructura del Proyecto

```
/widget
  /src
    /components
      ChatWidget.astro        # Componente principal
      MessageList.astro       # Lista de mensajes
      MessageInput.astro      # Input de mensajes
    /scripts
      widget.ts               # Web Component
      api-client.ts           # Cliente API
      storage.ts              # LocalStorage
      types.ts                # TypeScript types
    /styles
      widget.css              # Estilos del widget
    index.astro               # Página de demo
  /public
    favicon.svg
  astro.config.mjs
  build-widget.js             # Script de build personalizado
  package.json
  tsconfig.json
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run build:widget # Build solo del widget
```

## 🎨 Personalización

### Colores

El widget usa CSS custom properties que pueden ser sobrescritas:

```css
chatbot-widget {
  --primary-color: #3B82F6;
  --background-color: #FFFFFF;
  --text-color: #1F2937;
  --border-radius: 12px;
}
```

### Estilos Personalizados

```html
<style>
  chatbot-widget::part(container) {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  }
  
  chatbot-widget::part(header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
</style>
```

### Temas

**Light Theme (default):**
```html
<chatbot-widget theme="light"></chatbot-widget>
```

**Dark Theme:**
```html
<chatbot-widget theme="dark"></chatbot-widget>
```

## 🔌 API del Widget

### Métodos Públicos

```javascript
const widget = document.querySelector('chatbot-widget');

// Abrir chat
widget.open();

// Cerrar chat
widget.close();

// Toggle chat
widget.toggle();

// Enviar mensaje programáticamente
widget.sendMessage('Hola');

// Limpiar conversación
widget.clearConversation();
```

### Eventos

```javascript
const widget = document.querySelector('chatbot-widget');

// Cuando se abre el chat
widget.addEventListener('open', () => {
  console.log('Chat abierto');
});

// Cuando se cierra el chat
widget.addEventListener('close', () => {
  console.log('Chat cerrado');
});

// Cuando se envía un mensaje
widget.addEventListener('message-sent', (event) => {
  console.log('Mensaje enviado:', event.detail.message);
});

// Cuando se recibe una respuesta
widget.addEventListener('message-received', (event) => {
  console.log('Respuesta recibida:', event.detail.message);
});
```

## 💾 Almacenamiento Local

El widget guarda automáticamente:
- ID de conversación
- Historial de mensajes (últimos 50)
- Estado abierto/cerrado

Datos guardados en `localStorage`:
```javascript
{
  "chatbot-widget-conversation-id": "uuid",
  "chatbot-widget-messages": [...],
  "chatbot-widget-open": true
}
```

## 🔒 Seguridad

### CORS

El backend debe permitir requests desde dominios donde se embebe el widget:

```typescript
// backend/main.ts
app.enableCors({
  origin: ['https://cliente1.com', 'https://cliente2.com'],
  credentials: true,
});
```

### Content Security Policy

Si el sitio tiene CSP, agregar:

```html
<meta http-equiv="Content-Security-Policy" 
      content="connect-src 'self' https://api.tudominio.com;">
```

### Sanitización

El widget sanitiza automáticamente el HTML de los mensajes para prevenir XSS.

## 📱 Responsive

El widget se adapta automáticamente:

**Desktop:**
- Ventana flotante en la esquina
- Tamaño: 400px × 600px

**Mobile:**
- Pantalla completa
- Optimizado para touch

## 🎯 Optimización

### Bundle Size

El widget está optimizado para ser ligero:
- JavaScript: ~30KB (gzipped)
- CSS: ~5KB (gzipped)
- Total: ~35KB

### Lazy Loading

El widget se carga de forma asíncrona:

```html
<script src="widget.js" defer></script>
```

### Performance

- Renderizado eficiente con Shadow DOM
- Debouncing en input
- Virtual scrolling para mensajes largos

## 🧪 Testing

### Tests Unitarios

```bash
npm run test
```

### Tests E2E

```bash
npm run test:e2e
```

### Testing Manual

Abrir `http://localhost:4321` para ver demo interactivo.

## 🚀 Despliegue

### CDN

1. Build del widget:
```bash
npm run build:widget
```

2. Subir `dist/widget.js` a CDN (Cloudflare, AWS S3, etc.)

3. Configurar CORS en CDN

### Self-hosted

```bash
# Build
npm run build

# Servir con nginx
cp dist/* /var/www/html/widget/
```

### Docker

```bash
# Build
docker build -t widget .

# Run
docker run -p 4321:4321 widget
```

## 🔧 Configuración Avanzada

### Custom API Client

```javascript
// Sobrescribir cliente API
const widget = document.querySelector('chatbot-widget');
widget.apiClient = {
  async sendMessage(message) {
    // Custom implementation
  }
};
```

### Interceptores

```javascript
// Interceptar mensajes antes de enviar
widget.beforeSend = (message) => {
  console.log('Enviando:', message);
  return message; // o modificar
};

// Interceptar respuestas
widget.afterReceive = (response) => {
  console.log('Recibido:', response);
  return response; // o modificar
};
```

## 📊 Analytics

### Tracking de Eventos

```javascript
const widget = document.querySelector('chatbot-widget');

widget.addEventListener('message-sent', (event) => {
  // Google Analytics
  gtag('event', 'chatbot_message_sent', {
    bot_id: widget.getAttribute('bot-id'),
    message_length: event.detail.message.length,
  });
});

widget.addEventListener('open', () => {
  gtag('event', 'chatbot_opened');
});
```

## 🐛 Debugging

### Modo Debug

```html
<chatbot-widget 
  bot-id="abc-123"
  api-url="https://api.example.com"
  debug="true">
</chatbot-widget>
```

Esto habilitará logs en consola:
```
[ChatWidget] Initialized
[ChatWidget] Message sent: Hello
[ChatWidget] Response received: Hi there!
```

### Inspeccionar Shadow DOM

En DevTools:
1. Seleccionar `<chatbot-widget>`
2. Expandir `#shadow-root`
3. Inspeccionar elementos internos

## 📚 Recursos

- [Astro Documentation](https://docs.astro.build/)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)

## 🤝 Contribuir

1. Mantener bundle size pequeño
2. Asegurar compatibilidad con navegadores modernos
3. Escribir tests para nuevas features
4. Actualizar documentación

## 📞 Soporte

Para problemas con el widget:
- GitHub Issues
- Documentación: `/docs`
- Email: support@example.com

## ⚠️ Compatibilidad

**Navegadores soportados:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**No soportado:**
- Internet Explorer
- Navegadores muy antiguos sin soporte para Web Components
