# Guía de Troubleshooting - Sistema de Chatbot

Esta guía te ayudará a diagnosticar y resolver problemas comunes en el sistema de chatbot, incluyendo cómo usar los endpoints de health check y cómo interpretar los logs.

## Tabla de Contenidos

1. [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)
2. [Problemas Comunes](#problemas-comunes)
3. [Interpretación de Logs](#interpretación-de-logs)
4. [Endpoints de Health Check](#endpoints-de-health-check)
5. [Checklist de Verificación](#checklist-de-verificación)

---

## Herramientas de Diagnóstico

### 1. Health Check Endpoints

El sistema expone varios endpoints para verificar el estado de los componentes:

```bash
# Estado de las colas
curl http://localhost:3000/health/queues

# Estado de WebSocket
curl http://localhost:3000/health/websocket

# Estado de proveedores de IA
curl http://localhost:3000/health/ai-providers

# Enviar mensaje de prueba
curl -X POST http://localhost:3000/health/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "chatbotId": "your-chatbot-id",
    "channel": "WIDGET",
    "externalUserId": "test-user",
    "message": "Hello"
  }'
```

### 2. Redis CLI

Para verificar el estado de las colas:

```bash
# Conectar a Redis
redis-cli

# Ver trabajos en cola
LLEN bull:incoming-messages:waiting
LLEN bull:ai-processing:waiting
LLEN bull:outgoing-messages:waiting

# Ver trabajos activos
LLEN bull:incoming-messages:active

# Ver trabajos fallidos
LLEN bull:incoming-messages:failed
```

### 3. Logs en Tiempo Real

```bash
# Ver todos los logs
cd backend
npm run start:dev

# Filtrar logs específicos
npm run start:dev | grep "Message"
npm run start:dev | grep "ERROR"
npm run start:dev | grep "Queue"
```

### 4. Script de Verificación E2E

```bash
# Ejecutar verificación completa del flujo
cd backend
npx ts-node scripts/verify-e2e-flow.ts
```

---

## Problemas Comunes

### 🔴 Problema 1: Usuario no recibe respuesta del chatbot

**Síntomas:**
- Usuario envía mensaje
- No recibe respuesta
- No hay errores visibles

**Diagnóstico:**

1. **Verificar que el mensaje llegó al backend:**
```bash
# Buscar en logs
grep "message received" logs/combined.log | tail -5
```

2. **Verificar estado de las colas:**
```bash
curl http://localhost:3000/health/queues
```

Buscar:
- ¿Hay trabajos en `waiting`?
- ¿Hay trabajos stuck en `active`?
- ¿Hay trabajos en `failed`?

3. **Verificar logs de procesamiento:**
```bash
# Buscar el messageId en los logs
grep "msg-uuid" logs/combined.log
```

**Soluciones:**

| Causa | Solución |
|-------|----------|
| Redis no está corriendo | `redis-server` o `docker-compose up redis` |
| Procesadores no registrados | Reiniciar backend: `npm run start:dev` |
| Error en AI processing | Verificar API key de OpenAI |
| WebSocket no conectado | Verificar CORS y namespace |
| WhatsApp QR no conectado | Escanear QR code nuevamente |

---

### 🔴 Problema 2: Colas con trabajos stuck

**Síntomas:**
- Trabajos en estado `active` por mucho tiempo
- No se procesan nuevos mensajes
- Cola `waiting` crece

**Diagnóstico:**

```bash
# Ver estado de colas
curl http://localhost:3000/health/queues

# Ver trabajos activos en Redis
redis-cli
> LRANGE bull:ai-processing:active 0 -1
```

**Soluciones:**

1. **Reiniciar procesadores:**
```bash
# Detener backend
Ctrl+C

# Limpiar trabajos stuck (opcional)
redis-cli
> DEL bull:ai-processing:active

# Reiniciar backend
npm run start:dev
```

2. **Aumentar timeout de trabajos:**
```typescript
// En queue configuration
{
  timeout: 30000 // 30 segundos
}
```

3. **Verificar que no hay deadlock:**
```bash
# Ver logs de errores
grep "timeout" logs/error.log
```

---

### 🔴 Problema 3: Circuit breaker activado

**Síntomas:**
- Error: "Circuit breaker open for openai"
- No se generan respuestas de IA
- Logs muestran múltiples fallos

**Diagnóstico:**

```bash
# Verificar estado de circuit breakers
curl http://localhost:3000/health/ai-providers
```

Respuesta:
```json
{
  "providers": [
    {
      "name": "openai",
      "circuitBreaker": {
        "state": "OPEN",
        "failureCount": 5,
        "lastFailure": "2025-11-21T10:30:00.000Z"
      }
    }
  ]
}
```

**Soluciones:**

1. **Verificar API key:**
```bash
# En .env
echo $OPENAI_API_KEY
```

2. **Verificar rate limits:**
- Revisar dashboard de OpenAI
- Verificar límites de tu plan

3. **Esperar reset del circuit breaker:**
- Por defecto: 60 segundos
- El circuit breaker se resetea automáticamente

4. **Reset manual (si es necesario):**
```bash
# Reiniciar backend
npm run start:dev
```

---

### 🔴 Problema 4: WebSocket no conecta (Widget)

**Síntomas:**
- Widget no recibe mensajes
- Error de CORS en browser console
- WebSocket connection failed

**Diagnóstico:**

1. **Verificar en browser console:**
```javascript
// Abrir DevTools → Console
// Buscar errores de WebSocket o CORS
```

2. **Verificar configuración de CORS:**
```bash
# En backend/.env
echo $ALLOWED_ORIGINS
```

3. **Verificar estado de WebSocket:**
```bash
curl http://localhost:3000/health/websocket
```

**Soluciones:**

1. **Agregar origen a ALLOWED_ORIGINS:**
```bash
# En backend/.env
ALLOWED_ORIGINS=http://localhost:3002,http://localhost:4321
```

2. **Verificar namespace:**
```javascript
// En Widget
const socket = io('http://localhost:3000/messages', {
  transports: ['websocket']
});
```

3. **Verificar que el backend está corriendo:**
```bash
curl http://localhost:3000/health
```

---

### 🔴 Problema 5: WhatsApp QR no envía mensajes

**Síntomas:**
- Mensajes se marcan como SENT pero no llegan
- Error: "Session not connected"
- Microservicio no responde

**Diagnóstico:**

1. **Verificar microservicio está corriendo:**
```bash
curl http://localhost:3001/health
```

2. **Verificar estado de sesión:**
```bash
curl http://localhost:3000/whatsapp-qr/sessions/{chatbotId}
```

3. **Ver logs del microservicio:**
```bash
cd whatsapp-qr-service
npm run start | grep "ERROR"
```

**Soluciones:**

1. **Iniciar microservicio:**
```bash
cd whatsapp-qr-service
npm run start
```

2. **Reconectar sesión:**
- Escanear QR code nuevamente
- Verificar WhatsApp está abierto en el teléfono

3. **Verificar URL del microservicio:**
```bash
# En backend/.env
echo $WHATSAPP_QR_SERVICE_URL
# Debe ser: http://localhost:3001
```

---

### 🔴 Problema 6: Respuestas de IA son lentas

**Síntomas:**
- Respuestas tardan más de 5 segundos
- Timeout en AI processing
- Usuarios se quejan de lentitud

**Diagnóstico:**

```bash
# Ver tiempo de respuesta en logs
grep "AI response generated" logs/combined.log | grep "responseTime"
```

**Soluciones:**

1. **Usar modelo más rápido:**
```typescript
// Cambiar de gpt-4 a gpt-3.5-turbo
aiModel: 'gpt-3.5-turbo'
```

2. **Reducir maxTokens:**
```typescript
maxTokens: 300 // en lugar de 500
```

3. **Reducir contexto:**
```typescript
// En AIService.buildPrompt()
const contextLimit = 5; // en lugar de 10
```

4. **Verificar latencia de red:**
```bash
ping api.openai.com
```

---

### 🔴 Problema 7: Mensajes duplicados

**Síntomas:**
- Usuario recibe la misma respuesta múltiples veces
- Logs muestran procesamiento duplicado
- Base de datos tiene mensajes duplicados

**Diagnóstico:**

```bash
# Buscar mensajes duplicados
grep "messageId" logs/combined.log | sort | uniq -c | sort -nr
```

**Soluciones:**

1. **Verificar idempotencia:**
- Asegurar que los trabajos no se encolan múltiples veces
- Usar `jobId` único basado en messageId

2. **Limpiar trabajos duplicados:**
```bash
redis-cli
> DEL bull:outgoing-messages:waiting
```

3. **Agregar deduplicación:**
```typescript
await queue.add('process', data, {
  jobId: `msg-${messageId}`, // Previene duplicados
  removeOnComplete: true
});
```

---

## Interpretación de Logs

### Formato de Logs

Los logs siguen este formato JSON:

```json
{
  "timestamp": "2025-11-21T10:30:00.000Z",
  "level": "info",
  "message": "Descripción del evento",
  "context": "NombreDelComponente",
  "data": {
    "campo1": "valor1",
    "campo2": "valor2"
  }
}
```

### Niveles de Log

| Nivel | Descripción | Cuándo aparece |
|-------|-------------|----------------|
| `debug` | Información detallada | Solo en desarrollo |
| `info` | Eventos normales | Operaciones exitosas |
| `warn` | Advertencias | Situaciones inusuales pero manejables |
| `error` | Errores | Fallos que requieren atención |

### Logs Clave por Etapa

#### 1. Recepción de Mensaje

**Widget:**
```json
{
  "level": "info",
  "message": "Widget message received",
  "context": "WidgetService",
  "data": {
    "messageId": "msg-uuid",
    "conversationId": "conv-uuid"
  }
}
```

**WhatsApp QR:**
```json
{
  "level": "info",
  "message": "WhatsApp QR webhook received",
  "context": "WhatsAppQRController",
  "data": {
    "sessionId": "session-uuid",
    "from": "5491234567890@s.whatsapp.net"
  }
}
```

#### 2. Encolado

```json
{
  "level": "info",
  "message": "Message enqueued",
  "context": "QueueService",
  "data": {
    "messageId": "msg-uuid",
    "queueName": "incoming-messages",
    "jobId": "job-123"
  }
}
```

#### 3. Procesamiento de IA

```json
{
  "level": "info",
  "message": "AI response generated",
  "context": "AIProcessingProcessor",
  "data": {
    "messageId": "msg-uuid",
    "provider": "openai",
    "model": "gpt-4",
    "tokensUsed": 150,
    "responseTime": 1200
  }
}
```

#### 4. Envío

**Widget:**
```json
{
  "level": "info",
  "message": "Message emitted via WebSocket",
  "context": "MessagesGateway",
  "data": {
    "messageId": "msg-uuid",
    "room": "conversation:conv-uuid",
    "connectedClients": 1
  }
}
```

**WhatsApp QR:**
```json
{
  "level": "info",
  "message": "WhatsApp QR message sent successfully",
  "context": "WhatsAppQRSendProcessor",
  "data": {
    "messageId": "msg-uuid",
    "deliveryStatus": "SENT"
  }
}
```

### Logs de Error

#### Error de Configuración

```json
{
  "level": "error",
  "message": "OPENAI_API_KEY not configured",
  "context": "OpenAIProvider",
  "stack": "Error: OPENAI_API_KEY not configured\n    at ..."
}
```

**Acción:** Configurar variable de entorno

#### Error de Red

```json
{
  "level": "error",
  "message": "Failed to connect to WhatsApp QR Service",
  "context": "WhatsAppQRService",
  "error": "ECONNREFUSED",
  "data": {
    "url": "http://localhost:3001/send-message"
  }
}
```

**Acción:** Verificar microservicio está corriendo

#### Error de Rate Limit

```json
{
  "level": "error",
  "message": "AI generation failed",
  "context": "AIService",
  "error": "OpenAI rate limit exceeded",
  "data": {
    "provider": "openai",
    "model": "gpt-4"
  }
}
```

**Acción:** Esperar o cambiar a plan superior

---

## Endpoints de Health Check

### GET /health/queues

Muestra el estado de todas las colas.

**Request:**
```bash
curl http://localhost:3000/health/queues
```

**Response:**
```json
{
  "queues": [
    {
      "name": "incoming-messages",
      "waiting": 0,
      "active": 1,
      "completed": 523,
      "failed": 2,
      "delayed": 0,
      "paused": false
    },
    {
      "name": "ai-processing",
      "waiting": 0,
      "active": 1,
      "completed": 521,
      "failed": 3,
      "delayed": 0,
      "paused": false
    },
    {
      "name": "outgoing-messages",
      "waiting": 0,
      "active": 0,
      "completed": 520,
      "failed": 1,
      "delayed": 0,
      "paused": false
    }
  ]
}
```

**Interpretación:**
- `waiting`: Trabajos esperando ser procesados
- `active`: Trabajos siendo procesados ahora
- `completed`: Trabajos completados exitosamente
- `failed`: Trabajos que fallaron
- `paused`: Si la cola está pausada

**Señales de Alerta:**
- ⚠️ `waiting > 100` - Cola congestionada
- ⚠️ `active > 0` por más de 5 min - Trabajo stuck
- ⚠️ `failed / completed > 0.05` - Alta tasa de fallos

---

### GET /health/websocket

Muestra el estado de las conexiones WebSocket.

**Request:**
```bash
curl http://localhost:3000/health/websocket
```

**Response:**
```json
{
  "connected": 3,
  "rooms": {
    "conversation:conv-uuid-1": 1,
    "conversation:conv-uuid-2": 2
  }
}
```

**Interpretación:**
- `connected`: Total de clientes conectados
- `rooms`: Clientes por conversación

**Señales de Alerta:**
- ⚠️ `connected = 0` - Nadie conectado (puede ser normal)
- ⚠️ Room sin clientes - Usuario desconectado

---

### GET /health/ai-providers

Muestra el estado de los proveedores de IA.

**Request:**
```bash
curl http://localhost:3000/health/ai-providers
```

**Response:**
```json
{
  "providers": [
    {
      "name": "openai",
      "configured": true,
      "circuitBreaker": {
        "state": "CLOSED",
        "failureCount": 0,
        "successCount": 0,
        "lastFailure": null
      }
    },
    {
      "name": "anthropic",
      "configured": false,
      "circuitBreaker": {
        "state": "CLOSED",
        "failureCount": 0,
        "successCount": 0,
        "lastFailure": null
      }
    }
  ]
}
```

**Interpretación:**
- `configured`: Si el proveedor tiene API key
- `state`: Estado del circuit breaker
  - `CLOSED` = Normal ✅
  - `HALF_OPEN` = Probando ⚠️
  - `OPEN` = Bloqueado ❌
- `failureCount`: Fallos consecutivos

**Señales de Alerta:**
- ⚠️ `configured = false` - Falta API key
- ⚠️ `state = OPEN` - Demasiados fallos
- ⚠️ `failureCount > 3` - Problemas con el proveedor

---

### POST /health/test-message

Envía un mensaje de prueba y rastrea su flujo.

**Request:**
```bash
curl -X POST http://localhost:3000/health/test-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "chatbotId": "chatbot-uuid",
    "channel": "WIDGET",
    "externalUserId": "test-user-123",
    "message": "Hello, this is a test"
  }'
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-test-uuid",
  "conversationId": "conv-test-uuid",
  "stages": [
    {
      "stage": "received",
      "timestamp": "2025-11-21T10:30:00.000Z",
      "status": "success"
    },
    {
      "stage": "queued",
      "timestamp": "2025-11-21T10:30:00.100Z",
      "status": "success",
      "details": { "jobId": "job-123" }
    },
    {
      "stage": "ai_processing",
      "timestamp": "2025-11-21T10:30:01.200Z",
      "status": "success",
      "details": {
        "provider": "openai",
        "tokensUsed": 150
      }
    },
    {
      "stage": "sent",
      "timestamp": "2025-11-21T10:30:01.500Z",
      "status": "success"
    }
  ]
}
```

**Uso:**
- Verificar que el flujo completo funciona
- Identificar en qué etapa falla
- Medir tiempos de procesamiento

---

## Checklist de Verificación

### ✅ Verificación Inicial (5 minutos)

```bash
# 1. Redis está corriendo
redis-cli ping
# Esperado: PONG

# 2. Backend está corriendo
curl http://localhost:3000/health
# Esperado: 200 OK

# 3. Colas están procesando
curl http://localhost:3000/health/queues
# Esperado: active = 0, waiting = 0

# 4. Proveedores de IA configurados
curl http://localhost:3000/health/ai-providers
# Esperado: configured = true, state = CLOSED

# 5. (Opcional) WhatsApp QR Service corriendo
curl http://localhost:3001/health
# Esperado: 200 OK
```

### ✅ Verificación de Flujo Widget (10 minutos)

```bash
# 1. Enviar mensaje de prueba
curl -X POST http://localhost:3000/health/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "chatbotId": "your-chatbot-id",
    "channel": "WIDGET",
    "externalUserId": "test-user",
    "message": "Test message"
  }'

# 2. Verificar respuesta exitosa
# Esperado: success = true, todas las stages = success

# 3. Verificar en logs
grep "test-user" logs/combined.log

# 4. Verificar WebSocket
curl http://localhost:3000/health/websocket
```

### ✅ Verificación de Flujo WhatsApp QR (15 minutos)

```bash
# 1. Verificar sesión conectada
curl http://localhost:3000/whatsapp-qr/sessions/{chatbotId}
# Esperado: status = CONNECTED

# 2. Enviar mensaje de prueba
curl -X POST http://localhost:3000/health/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "chatbotId": "your-chatbot-id",
    "channel": "WHATSAPP_QR",
    "externalUserId": "5491234567890@s.whatsapp.net",
    "message": "Test message"
  }'

# 3. Verificar en WhatsApp
# Abrir WhatsApp y verificar que llegó el mensaje

# 4. Verificar logs del microservicio
cd whatsapp-qr-service
npm run start | grep "Message sent"
```

### ✅ Verificación de Performance (5 minutos)

```bash
# 1. Ver métricas de colas
curl http://localhost:3000/health/queues

# 2. Calcular tasa de éxito
# success_rate = completed / (completed + failed)

# 3. Ver tiempos de respuesta en logs
grep "responseTime" logs/combined.log | tail -20

# 4. Ver uso de tokens
grep "tokensUsed" logs/combined.log | tail -20
```

---

## Comandos Útiles

### Limpiar Colas

```bash
redis-cli
> FLUSHDB  # ⚠️ Borra TODAS las colas
```

### Ver Trabajos Fallidos

```bash
redis-cli
> LRANGE bull:ai-processing:failed 0 -1
```

### Pausar/Reanudar Cola

```bash
# En código
await queue.pause();
await queue.resume();
```

### Ver Logs Filtrados

```bash
# Solo errores
npm run start:dev 2>&1 | grep "ERROR"

# Solo mensajes
npm run start:dev 2>&1 | grep "Message"

# Solo AI processing
npm run start:dev 2>&1 | grep "AI"
```

### Monitorear en Tiempo Real

```bash
# Logs del backend
tail -f logs/combined.log

# Logs de errores
tail -f logs/error.log

# Logs del microservicio
cd whatsapp-qr-service
tail -f logs/app.log
```

---

## Contacto y Soporte

Si después de seguir esta guía aún tienes problemas:

1. **Recopilar información:**
   - Logs relevantes
   - Respuesta de health checks
   - Pasos para reproducir el problema

2. **Crear issue en GitHub:**
   - Incluir toda la información recopilada
   - Especificar versión del sistema
   - Incluir configuración (sin API keys)

3. **Consultar documentación adicional:**
   - [MESSAGE_FLOW_WIDGET.md](./MESSAGE_FLOW_WIDGET.md)
   - [MESSAGE_FLOW_WHATSAPP_QR.md](./MESSAGE_FLOW_WHATSAPP_QR.md)
   - [AI_PROCESSING.md](./AI_PROCESSING.md)
   - [OUTGOING_MESSAGES.md](./OUTGOING_MESSAGES.md)

---

## Referencias

- [BullMQ Troubleshooting](https://docs.bullmq.io/guide/troubleshooting)
- [Redis Debugging](https://redis.io/docs/manual/debugging/)
- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Socket.IO Debugging](https://socket.io/docs/v4/troubleshooting-connection-issues/)
