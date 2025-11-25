# WhatsApp QR Service

Microservicio Node.js especializado para gestionar conexiones WhatsApp Business mediante escaneo de código QR usando la librería Baileys.

## 🎯 Propósito

Este servicio permite a los clientes conectar sus cuentas de WhatsApp Business sin necesidad de la API oficial de Meta, simplemente escaneando un código QR con su teléfono.

## 🏗️ Arquitectura

El servicio funciona de manera independiente y se comunica con el API Backend mediante:
- **HTTP REST**: Para recibir comandos (iniciar sesión, enviar mensajes, etc.)
- **HTTP POST**: Para notificar eventos al backend (mensajes entrantes, cambios de estado)

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- Redis (para coordinación con backend)

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar .env
```

### Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run dev

# Ver logs
# Los logs se muestran en consola
```

### Producción

```bash
# Build
npm run build

# Iniciar
npm start
```

## 📁 Estructura del Proyecto

```
/whatsapp-qr-service
  /src
    index.ts              # Entry point y servidor Express
    sessionManager.ts     # Gestión de sesiones Baileys
    messageHandler.ts     # Procesamiento de mensajes
    events.ts             # Emisión de eventos al backend
    api.ts                # Definición de endpoints
    types.ts              # TypeScript types
  /sessions               # Persistencia de sesiones (auto-generado)
  /dist                   # Código compilado
  package.json
  tsconfig.json
  Dockerfile
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo con ts-node-dev
npm run build        # Compilar TypeScript
npm start            # Iniciar en producción
npm run clean        # Limpiar sesiones guardadas
```

## 🔑 Variables de Entorno

```env
# Puerto del servicio
PORT=3001

# URL del backend para notificaciones
BACKEND_URL=http://localhost:3000

# Directorio de sesiones
SESSIONS_DIR=./sessions

# Nivel de logs
LOG_LEVEL=info
```

## 🔌 API Endpoints

### POST /init
Iniciar nueva sesión WhatsApp.

**Request:**
```json
{
  "sessionId": "unique-session-id",
  "chatbotId": "chatbot-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "unique-session-id",
  "status": "connecting"
}
```

### GET /qr-code/:sessionId
Obtener código QR para escanear.

**Response:**
```json
{
  "qrCode": "data:image/png;base64,...",
  "status": "qr_ready"
}
```

### GET /status/:sessionId
Consultar estado de conexión.

**Response:**
```json
{
  "sessionId": "unique-session-id",
  "status": "connected",
  "lastConnectedAt": "2024-01-15T10:30:00Z"
}
```

Estados posibles:
- `disconnected`: Sin conexión
- `connecting`: Iniciando conexión
- `qr_ready`: QR generado, esperando escaneo
- `connected`: Conectado exitosamente

### POST /send
Enviar mensaje por WhatsApp.

**Request:**
```json
{
  "sessionId": "unique-session-id",
  "to": "56912345678",
  "message": "Hola, ¿cómo estás?"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "whatsapp-message-id"
}
```

### POST /disconnect
Cerrar sesión WhatsApp.

**Request:**
```json
{
  "sessionId": "unique-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session disconnected"
}
```

## 📡 Notificaciones al Backend

El servicio envía notificaciones HTTP POST al backend en los siguientes eventos:

### QR Code Generado
```
POST {BACKEND_URL}/whatsapp-qr/webhook
{
  "type": "qr",
  "sessionId": "unique-session-id",
  "data": {
    "qrCode": "data:image/png;base64,..."
  }
}
```

### Conexión Establecida
```
POST {BACKEND_URL}/whatsapp-qr/webhook
{
  "type": "connected",
  "sessionId": "unique-session-id",
  "data": {
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Desconexión
```
POST {BACKEND_URL}/whatsapp-qr/webhook
{
  "type": "disconnected",
  "sessionId": "unique-session-id",
  "data": {
    "reason": "logout"
  }
}
```

### Mensaje Entrante
```
POST {BACKEND_URL}/whatsapp-qr/incoming
{
  "sessionId": "unique-session-id",
  "from": "56912345678",
  "message": "Hola",
  "timestamp": "2024-01-15T10:30:00Z",
  "messageId": "whatsapp-message-id"
}
```

## 🔄 Flujo de Conexión

1. **Cliente solicita iniciar sesión** → `POST /init`
2. **Servicio genera QR** → Notifica al backend con QR code
3. **Cliente obtiene QR** → `GET /qr-code/:sessionId`
4. **Usuario escanea QR** con WhatsApp
5. **Conexión establecida** → Notifica al backend
6. **Sesión persistida** → Se guarda en `/sessions`
7. **Reconexión automática** → Si se pierde conexión

## 💾 Persistencia de Sesiones

Las sesiones se guardan en el directorio `/sessions` usando `useMultiFileAuthState` de Baileys:

```
/sessions
  /session-id-1
    creds.json
    app-state-sync-key-*.json
    app-state-sync-version-*.json
  /session-id-2
    creds.json
    ...
```

Esto permite que las sesiones persistan entre reinicios del servicio.

## 🔄 Reconexión Automática

El servicio implementa reconexión automática:
- Detecta pérdida de conexión
- Intenta reconectar automáticamente
- Usa credenciales guardadas
- Notifica al backend del estado

## 🐛 Debugging

### Logs Detallados

Configurar `LOG_LEVEL=debug` en `.env` para ver logs detallados de Baileys.

### Limpiar Sesiones

Si hay problemas con una sesión:

```bash
# Eliminar sesión específica
rm -rf sessions/session-id

# Eliminar todas las sesiones
npm run clean
```

### Problemas Comunes

**QR no se genera:**
- Verificar que el puerto no esté en uso
- Revisar logs para errores de Baileys

**Desconexión frecuente:**
- Verificar conexión a internet
- Asegurar que el teléfono tenga WhatsApp activo
- Revisar que no haya múltiples dispositivos conectados

**Mensajes no se envían:**
- Verificar que la sesión esté conectada
- Verificar formato del número (código país + número)
- Revisar logs para errores

## 🚀 Despliegue

### Con Docker

```bash
# Build
docker build -t whatsapp-qr-service .

# Run
docker run -p 3001:3001 \
  -v $(pwd)/sessions:/app/sessions \
  --env-file .env \
  whatsapp-qr-service
```

**Importante:** Montar volumen para `/sessions` para persistir sesiones.

### Con Docker Compose

Ver `docker-compose.yml` en la raíz del proyecto.

## 🔒 Seguridad

### Consideraciones

- Las sesiones contienen credenciales sensibles
- Proteger el directorio `/sessions`
- No exponer el servicio directamente a internet
- Usar red interna de Docker para comunicación con backend
- Implementar autenticación en endpoints si es necesario

### Recomendaciones

```yaml
# docker-compose.yml
whatsapp-qr-service:
  networks:
    - internal
  # No exponer puerto públicamente
```

## 📊 Monitoreo

### Health Check

```bash
curl http://localhost:3001/health
```

### Métricas

El servicio registra:
- Número de sesiones activas
- Mensajes enviados/recibidos
- Errores de conexión
- Tiempo de actividad

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests de integración
npm run test:integration
```

## 📚 Recursos

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [WhatsApp Web Protocol](https://github.com/sigalor/whatsapp-web-reveng)

## ⚠️ Limitaciones

- WhatsApp puede banear cuentas que usen conexiones no oficiales
- Recomendado solo para uso personal o testing
- Para producción, considerar WhatsApp Cloud API oficial
- Máximo 4 dispositivos conectados simultáneamente por cuenta

## 🤝 Contribuir

1. Crear rama desde `develop`
2. Seguir convenciones de código
3. Escribir tests
4. Crear Pull Request

## 📞 Soporte

Para problemas específicos del servicio WhatsApp QR, crear un issue en GitHub.
