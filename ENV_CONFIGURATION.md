# 🔧 Configuración de Variables de Entorno

Este documento describe la configuración de variables de entorno para ejecutar el sistema en modo desarrollo local con MySQL y Redis en Docker.

## 📋 Resumen de Configuración

### Servicios en Docker
- **MySQL**: Puerto 3306 (accesible desde localhost:3306)
- **Redis**: Puerto 6379 (accesible desde localhost:6379)

### Servicios Locales (Node.js)
- **Backend API**: Puerto 3000
- **WhatsApp QR Service**: Puerto 3001
- **Dashboard**: Puerto 3002
- **Widget**: Puerto 4321

## 📁 Archivos de Configuración

### 1. Backend API (`backend/.env`)

```env
# Database (MySQL en Docker)
DATABASE_URL="mysql://chatbot_user:chatbot_password@localhost:3306/chatbot_saas"

# Redis (Redis en Docker)
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="24h"

# API
PORT=3000
API_PORT=3000
NODE_ENV="development"

# CORS - Permitir acceso desde dashboard y widget
ALLOWED_ORIGINS="http://localhost:3002,http://localhost:4321,http://localhost"

# WhatsApp QR Service (local)
WHATSAPP_QR_SERVICE_URL="http://localhost:3001"

# WhatsApp Cloud API
WHATSAPP_APP_SECRET="your-whatsapp-app-secret-change-in-production"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token-change-in-production"

# AI Providers
OPENAI_API_KEY="sk-proj-..." # ✅ Ya configurada
ANTHROPIC_API_KEY=""
GROQ_API_KEY=""
GOOGLE_AI_API_KEY=""
MISTRAL_API_KEY=""
COHERE_API_KEY=""
LLAMA_API_KEY=""
LLAMA_API_URL="https://api.llama-api.com"

# Payment Gateways
FLOW_API_KEY=""
FLOW_SECRET_KEY=""
FLOW_BASE_URL="https://www.flow.cl/api"

PAYPAL_CLIENT_ID=""
PAYPAL_SECRET=""
PAYPAL_BASE_URL="https://api-m.paypal.com"

# Exchange Rate API
EXCHANGE_RATE_API_KEY=""
EXCHANGE_RATE_API_URL="https://v6.exchangerate-api.com/v6"

# Rate Limiting
RATE_LIMIT_TTL=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL="info"
```

**✅ Estado**: Configurado correctamente

### 2. Dashboard (`dashboard/.env`)

```env
# API Backend (local)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

**✅ Estado**: Configurado correctamente

### 3. WhatsApp QR Service (`whatsapp-qr-service/.env`)

```env
PORT=3001
BACKEND_URL=http://localhost:3000
SESSIONS_DIR=./sessions
LOG_LEVEL=info
```

**✅ Estado**: Configurado correctamente

### 4. Widget (`widget/.env`)

```env
# API Backend (local)
PUBLIC_API_URL=http://localhost:3000
```

**✅ Estado**: Configurado correctamente

## 🔗 Diagrama de Conexiones

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS EN DOCKER                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │    MySQL     │              │    Redis     │            │
│  │  Port: 3306  │              │  Port: 6379  │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                     │
└─────────┼──────────────────────────────┼─────────────────────┘
          │                              │
          │ localhost:3306               │ localhost:6379
          │                              │
┌─────────┴──────────────────────────────┴─────────────────────┐
│                   SERVICIOS LOCALES                           │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │           Backend API (Port 3000)                   │     │
│  │  - Conecta a MySQL (localhost:3306)                │     │
│  │  - Conecta a Redis (localhost:6379)                │     │
│  │  - Conecta a WhatsApp QR (localhost:3001)          │     │
│  └─────────┬──────────────────────────────────────────┘     │
│            │                                                  │
│            │ http://localhost:3000                           │
│            │                                                  │
│  ┌─────────┴──────────┐    ┌──────────────────┐            │
│  │  Dashboard         │    │  WhatsApp QR     │            │
│  │  Port: 3002        │    │  Port: 3001      │            │
│  │  Conecta a API     │    │  Conecta a API   │            │
│  └────────────────────┘    └──────────────────┘            │
│                                                              │
│  ┌────────────────────┐                                     │
│  │  Widget            │                                     │
│  │  Port: 4321        │                                     │
│  │  Conecta a API     │                                     │
│  └────────────────────┘                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🚀 Verificar Configuración

### 1. Verificar que MySQL y Redis estén corriendo

```bash
docker ps --filter "name=chatbot"
```

Deberías ver:
- `chatbot-mysql` - Status: Up (healthy)
- `chatbot-redis` - Status: Up (healthy)

### 2. Verificar conexión a MySQL

```bash
docker exec -it chatbot-mysql mysql -u chatbot_user -pchatbot_password -e "SELECT 1;"
```

Debería retornar: `1`

### 3. Verificar conexión a Redis

```bash
docker exec -it chatbot-redis redis-cli ping
```

Debería retornar: `PONG`

### 4. Verificar que las migraciones estén aplicadas

```bash
cd backend
npm run prisma:studio
```

Esto abrirá Prisma Studio en http://localhost:5555 donde puedes ver todas las tablas.

## 🔐 Credenciales

### MySQL
- **Host**: localhost
- **Puerto**: 3306
- **Usuario**: chatbot_user
- **Contraseña**: chatbot_password
- **Base de datos**: chatbot_saas

### Redis
- **Host**: localhost
- **Puerto**: 6379
- **Contraseña**: (ninguna)

### Usuario Root de MySQL (solo para administración)
- **Usuario**: root
- **Contraseña**: rootpassword

## 📝 Notas Importantes

### CORS
El backend está configurado para aceptar peticiones desde:
- `http://localhost:3002` (Dashboard)
- `http://localhost:4321` (Widget)
- `http://localhost` (Nginx si se usa)

Si necesitas agregar más orígenes, edita `ALLOWED_ORIGINS` en `backend/.env`.

### API Keys de IA
Ya tienes configurada la API key de OpenAI. Para agregar más proveedores:

1. Obtén las API keys de los proveedores que quieras usar
2. Agrégalas en `backend/.env`
3. Reinicia el backend

### WhatsApp
Para usar WhatsApp necesitas:

**Cloud API**:
1. Crear una app en Meta for Developers
2. Configurar WhatsApp Business API
3. Obtener `phoneNumberId` y `accessToken`
4. Configurar en el dashboard

**QR (Baileys)**:
1. Iniciar sesión desde el dashboard
2. Escanear el código QR con WhatsApp
3. La sesión se guarda en `whatsapp-qr-service/sessions/`

### Logs
Los logs del backend se guardan en:
- `backend/logs/combined.log` - Todos los logs
- `backend/logs/error.log` - Solo errores

## 🔄 Cambiar Configuración

Si necesitas cambiar alguna configuración:

1. Edita el archivo `.env` correspondiente
2. Reinicia el servicio afectado
3. Verifica que los cambios se hayan aplicado

### Ejemplo: Cambiar puerto del backend

1. Edita `backend/.env`:
   ```env
   PORT=3005
   API_PORT=3005
   ```

2. Edita `dashboard/.env`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3005
   NEXT_PUBLIC_WS_URL=ws://localhost:3005
   ```

3. Edita `widget/.env`:
   ```env
   PUBLIC_API_URL=http://localhost:3005
   ```

4. Edita `whatsapp-qr-service/.env`:
   ```env
   BACKEND_URL=http://localhost:3005
   ```

5. Reinicia todos los servicios

## ✅ Checklist de Configuración

- [x] MySQL corriendo en Docker (puerto 3306)
- [x] Redis corriendo en Docker (puerto 6379)
- [x] Permisos de MySQL configurados
- [x] Migraciones de base de datos aplicadas
- [x] `backend/.env` configurado
- [x] `dashboard/.env` configurado
- [x] `whatsapp-qr-service/.env` configurado
- [x] `widget/.env` configurado
- [x] API key de OpenAI configurada
- [x] CORS configurado correctamente

## 🎯 Próximos Pasos

1. Inicia los servicios siguiendo `START_LOCAL.md`
2. Registra un usuario en el dashboard
3. Crea tu primer chatbot
4. ¡Empieza a desarrollar!

## 📚 Referencias

- [START_LOCAL.md](./START_LOCAL.md) - Guía para iniciar el sistema
- [INSTALLATION.md](./INSTALLATION.md) - Guía de instalación completa
- [README.md](./README.md) - Documentación general
