# Documentación del Sistema de Chatbot

Esta carpeta contiene la documentación completa del sistema de chatbot, incluyendo flujos de mensajes, procesamiento de IA, y guías de troubleshooting.

## 📚 Índice de Documentación

### Flujos de Mensajes

1. **[Flujo de Widget](./MESSAGE_FLOW_WIDGET.md)**
   - Diagrama de secuencia completo
   - Pasos detallados del flujo
   - Logs esperados en cada etapa
   - Problemas comunes y soluciones
   - Tiempo de procesamiento: ~1.6s

2. **[Flujo de WhatsApp QR](./MESSAGE_FLOW_WHATSAPP_QR.md)**
   - Diagrama de secuencia completo
   - Integración con microservicio
   - Pasos detallados del flujo
   - Logs esperados en cada etapa
   - Problemas comunes y soluciones
   - Tiempo de procesamiento: ~2.3s

### Componentes del Sistema

3. **[Procesamiento de IA](./AI_PROCESSING.md)**
   - Arquitectura de IA
   - Proveedores soportados (OpenAI, Anthropic)
   - Circuit breaker pattern
   - Configuración de chatbots
   - Manejo de errores
   - Optimizaciones

4. **[Envío de Mensajes Salientes](./OUTGOING_MESSAGES.md)**
   - Routing por canal
   - Handlers específicos (Widget, WhatsApp QR)
   - Delivery status
   - Retry logic
   - Manejo de errores
   - Optimizaciones

### Guías de Operación

5. **[Guía de Troubleshooting](./TROUBLESHOOTING_GUIDE.md)**
   - Herramientas de diagnóstico
   - Problemas comunes y soluciones
   - Interpretación de logs
   - Endpoints de health check
   - Checklist de verificación
   - Comandos útiles

## 🚀 Quick Start

### Para Desarrolladores Nuevos

1. **Entender el flujo básico:**
   - Lee [Flujo de Widget](./MESSAGE_FLOW_WIDGET.md) primero
   - Es el flujo más simple y directo

2. **Entender el procesamiento de IA:**
   - Lee [Procesamiento de IA](./AI_PROCESSING.md)
   - Aprende sobre proveedores y circuit breaker

3. **Entender el envío de mensajes:**
   - Lee [Envío de Mensajes Salientes](./OUTGOING_MESSAGES.md)
   - Aprende sobre routing y retry logic

### Para Troubleshooting

1. **Problema con respuestas:**
   - Ve directo a [Guía de Troubleshooting](./TROUBLESHOOTING_GUIDE.md)
   - Sigue el checklist de verificación

2. **Problema específico de canal:**
   - Widget: [Flujo de Widget](./MESSAGE_FLOW_WIDGET.md) → Sección "Problemas Comunes"
   - WhatsApp: [Flujo de WhatsApp QR](./MESSAGE_FLOW_WHATSAPP_QR.md) → Sección "Problemas Comunes"

## 🔍 Búsqueda Rápida

### Por Síntoma

| Síntoma | Documento | Sección |
|---------|-----------|---------|
| Usuario no recibe respuesta | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 1 |
| Colas con trabajos stuck | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 2 |
| Circuit breaker activado | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 3 |
| WebSocket no conecta | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 4 |
| WhatsApp no envía | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 5 |
| Respuestas lentas | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) | Problema 6 |

### Por Componente

| Componente | Documento |
|------------|-----------|
| WidgetController | [Flujo de Widget](./MESSAGE_FLOW_WIDGET.md) |
| WhatsAppQRController | [Flujo de WhatsApp QR](./MESSAGE_FLOW_WHATSAPP_QR.md) |
| AIProcessingProcessor | [Procesamiento de IA](./AI_PROCESSING.md) |
| OutgoingMessagesProcessor | [Envío de Mensajes](./OUTGOING_MESSAGES.md) |
| MessagesGateway | [Flujo de Widget](./MESSAGE_FLOW_WIDGET.md) |
| Circuit Breaker | [Procesamiento de IA](./AI_PROCESSING.md) |

### Por Tarea

| Tarea | Documento |
|-------|-----------|
| Configurar nuevo chatbot | [Procesamiento de IA](./AI_PROCESSING.md) → Configuración |
| Agregar nuevo proveedor de IA | [Procesamiento de IA](./AI_PROCESSING.md) → AI Providers |
| Configurar retry logic | [Envío de Mensajes](./OUTGOING_MESSAGES.md) → Retry Logic |
| Verificar estado del sistema | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) → Health Check |
| Interpretar logs | [Troubleshooting](./TROUBLESHOOTING_GUIDE.md) → Interpretación de Logs |

## 📊 Diagramas

### Arquitectura General

```
Usuario → Canal (Widget/WhatsApp) → Backend → Colas → AI → Colas → Envío → Usuario
```

### Flujo de Colas

```
incoming-messages → ai-processing → outgoing-messages → [widget | whatsapp-qr-send]
```

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                      │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   Widget     │    │  WhatsApp QR │    │   Queues │ │
│  │  Controller  │    │  Controller  │    │ (BullMQ) │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│         │                    │                  │       │
│         └────────────────────┴──────────────────┘       │
│                              │                          │
│                              ▼                          │
│                      ┌──────────────┐                  │
│                      │      AI      │                  │
│                      │   Service    │                  │
│                      └──────────────┘                  │
│                              │                          │
│                              ▼                          │
│                      ┌──────────────┐                  │
│                      │   Messages   │                  │
│                      │   Gateway    │                  │
│                      └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Herramientas de Diagnóstico

### Health Check Endpoints

```bash
# Estado de colas
GET /health/queues

# Estado de WebSocket
GET /health/websocket

# Estado de proveedores de IA
GET /health/ai-providers

# Mensaje de prueba
POST /health/test-message
```

### Comandos Útiles

```bash
# Verificar Redis
redis-cli ping

# Ver logs en tiempo real
npm run start:dev | grep "Message"

# Verificar colas
curl http://localhost:3000/health/queues

# Enviar mensaje de prueba
curl -X POST http://localhost:3000/health/test-message \
  -H "Content-Type: application/json" \
  -d '{"chatbotId":"...","channel":"WIDGET","externalUserId":"test","message":"Hello"}'
```

## 📈 Métricas Clave

| Métrica | Meta | Cómo Medir |
|---------|------|------------|
| Tasa de éxito | > 99% | `completed / (completed + failed)` |
| Tiempo de respuesta (Widget) | < 2s | Logs: `responseTime` |
| Tiempo de respuesta (WhatsApp) | < 3s | Logs: `responseTime` |
| Tasa de retry | < 5% | `retries / total` |
| Circuit breaker activaciones | < 1/día | Logs: `Circuit breaker open` |

## 🔗 Enlaces Externos

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference)
- [NestJS Documentation](https://docs.nestjs.com/)

## 📝 Notas de Versión

### v1.0.0 (2025-11-21)
- Documentación inicial completa
- Flujos de Widget y WhatsApp QR
- Procesamiento de IA con circuit breaker
- Guía de troubleshooting
- Health check endpoints

## 🤝 Contribuir

Para agregar o actualizar documentación:

1. Mantener el formato consistente
2. Incluir ejemplos de código
3. Incluir logs esperados
4. Agregar diagramas cuando sea útil
5. Actualizar este README con enlaces

## 📧 Contacto

Para preguntas o sugerencias sobre la documentación, crear un issue en el repositorio.
