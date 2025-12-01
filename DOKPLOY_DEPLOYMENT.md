# 🚀 Guía de Despliegue en Dokploy

Esta guía te llevará paso a paso para desplegar el SaaS de Chatbots con IA en Dokploy.

## 📋 Requisitos Previos

- ✅ Servidor VPS con Dokploy instalado
- ✅ Repositorio en GitHub
- ✅ Dominio apuntando a tu servidor (opcional pero recomendado)
- ✅ API Keys de proveedores de IA (OpenAI, Anthropic, etc.)

## 🏗️ Arquitectura en Dokploy

```
┌─────────────────────────────────────────┐
│           Dokploy Server                │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │  MySQL   │  │  Redis   │            │
│  │ Database │  │  Cache   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     Backend API (NestJS)         │  │
│  │     Puerto: 3000                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  WhatsApp QR Service (Node.js)   │  │
│  │     Puerto: 3002                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    Dashboard (Next.js)           │  │
│  │     Puerto: 3001                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │      Widget (Astro)              │  │
│  │     Puerto: 4321                 │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 📝 Paso 1: Preparar el Repositorio

### 1.1 Crear archivo `dokploy.yaml` en la raíz del proyecto

```yaml
# dokploy.yaml
version: "1.0"
name: chatbot-saas

services:
  # Base de datos MySQL
  mysql:
    type: database
    engine: mysql
    version: "8.0"
    database: chatbot_saas
    username: chatbot_user
    # La contraseña se configurará en Dokploy
    storage: 10GB
    
  # Redis para colas y caché
  redis:
    type: database
    engine: redis
    version: "7"
    storage: 2GB

  # API Backend
  backend:
    type: application
    build:
      context: ./backend
      dockerfile: Dockerfile
    port: 3000
    env_file: backend/.env
    healthcheck:
      path: /health
      interval: 30s
    resources:
      memory: 1GB
      cpu: 1
    depends_on:
      - mysql
      - redis

  # WhatsApp QR Service
  whatsapp-qr:
    type: application
    build:
      context: ./whatsapp-qr-service
      dockerfile: Dockerfile
    port: 3002
    env_file: whatsapp-qr-service/.env
    resources:
      memory: 512MB
      cpu: 0.5
    volumes:
      - whatsapp_sessions:/app/sessions
    depends_on:
      - backend
      - redis

  # Dashboard
  dashboard:
    type: application
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    port: 3001
    env_file: dashboard/.env
    resources:
      memory: 512MB
      cpu: 0.5
    depends_on:
      - backend

  # Widget
  widget:
    type: application
    build:
      context: ./widget
      dockerfile: Dockerfile
    port: 4321
    resources:
      memory: 256MB
      cpu: 0.25

volumes:
  whatsapp_sessions:
    size: 5GB
```

### 1.2 Verificar que existan los Dockerfiles

Asegúrate de tener estos archivos en tu repositorio:
- `backend/Dockerfile`
- `whatsapp-qr-service/Dockerfile`
- `dashboard/Dockerfile`
- `widget/Dockerfile`

### 1.3 Crear `.env.example` para cada servicio

Ya los tienes, pero verifica que estén actualizados.

### 1.4 Commit y push a GitHub

```bash
git add dokploy.yaml
git commit -m "Add Dokploy configuration"
git push origin main
```

## 🎯 Paso 2: Configurar en Dokploy

### 2.1 Crear Proyecto en Dokploy

1. Accede a tu panel de Dokploy: `https://tu-servidor.com:3000`
2. Click en **"New Project"**
3. Nombre: `chatbot-saas`
4. Click en **"Create"**

### 2.2 Conectar Repositorio de GitHub

1. En el proyecto, click en **"Connect Repository"**
2. Selecciona **GitHub**
3. Autoriza Dokploy si es necesario
4. Selecciona tu repositorio
5. Branch: `main` (o la que uses)
6. Click en **"Connect"**

## 🗄️ Paso 3: Configurar Bases de Datos

### 3.1 Crear MySQL

1. En tu proyecto, click en **"Add Service"**
2. Selecciona **"Database"**
3. Tipo: **MySQL 8.0**
4. Configuración:
   ```
   Name: chatbot-mysql
   Database: chatbot_saas
   Username: chatbot_user
   Password: [Genera una contraseña segura]
   Storage: 10GB
   ```
5. Click en **"Create"**
6. **Guarda la URL de conexión** que aparece (la necesitarás)

### 3.2 Crear Redis

1. Click en **"Add Service"**
2. Selecciona **"Database"**
3. Tipo: **Redis 7**
4. Configuración:
   ```
   Name: chatbot-redis
   Storage: 2GB
   ```
5. Click en **"Create"**
6. **Guarda la URL de conexión**

## 🔧 Paso 4: Desplegar Backend API

### 4.1 Crear Servicio Backend

1. Click en **"Add Service"**
2. Selecciona **"Application"**
3. Configuración básica:
   ```
   Name: backend-api
   Type: Dockerfile
   Build Context: ./backend
   Dockerfile Path: ./backend/Dockerfile
   Port: 3000
   ```

### 4.2 Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```env
# Base de Datos
DATABASE_URL=mysql://chatbot_user:TU_PASSWORD@chatbot-mysql:3306/chatbot_saas

# Redis
REDIS_URL=redis://chatbot-redis:6379

# JWT
JWT_SECRET=genera-un-secret-muy-seguro-aqui-min-32-caracteres
JWT_EXPIRATION=24h

# Aplicación
PORT=3000
NODE_ENV=production
API_URL=https://api.tudominio.com

# CORS (ajusta según tu dominio)
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com,https://dashboard.tudominio.com

# OpenAI
OPENAI_API_KEY=sk-tu-api-key-aqui

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui

# Google AI (opcional)
GOOGLE_AI_API_KEY=tu-api-key-aqui

# Groq (opcional)
GROQ_API_KEY=gsk_tu-api-key-aqui

# Mistral (opcional)
MISTRAL_API_KEY=tu-api-key-aqui

# Cohere (opcional)
COHERE_API_KEY=tu-api-key-aqui

# WhatsApp Cloud API (opcional)
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_APP_SECRET=tu-app-secret
WHATSAPP_VERIFY_TOKEN=tu-verify-token

# WhatsApp QR Service
WHATSAPP_QR_SERVICE_URL=http://whatsapp-qr:3002

# Pagos - Flow (opcional)
FLOW_API_KEY=tu-flow-api-key
FLOW_SECRET_KEY=tu-flow-secret-key
FLOW_API_URL=https://www.flow.cl/api
FLOW_WEBHOOK_URL=https://api.tudominio.com/api/payments/flow/webhook

# Pagos - PayPal (opcional)
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_SECRET=tu-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_URL=https://api.tudominio.com/api/payments/paypal/webhook

# Exchange Rates (opcional)
EXCHANGE_RATE_API_KEY=tu-exchange-rate-api-key
```

### 4.3 Configurar Health Check

```
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

### 4.4 Configurar Recursos

```
Memory: 1GB
CPU: 1 core
```

### 4.5 Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (puede tomar 5-10 minutos)
3. Verifica los logs para asegurarte que no hay errores

### 4.6 Ejecutar Migraciones

Una vez desplegado, necesitas ejecutar las migraciones:

1. En Dokploy, ve al servicio **backend-api**
2. Click en **"Console"** o **"Terminal"**
3. Ejecuta:
   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:seed
   ```

## 📱 Paso 5: Desplegar WhatsApp QR Service

### 5.1 Crear Servicio

1. Click en **"Add Service"**
2. Selecciona **"Application"**
3. Configuración:
   ```
   Name: whatsapp-qr
   Type: Dockerfile
   Build Context: ./whatsapp-qr-service
   Dockerfile Path: ./whatsapp-qr-service/Dockerfile
   Port: 3002
   ```

### 5.2 Variables de Entorno

```env
PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend-api:3000
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info
```

### 5.3 Configurar Volumen Persistente

En **"Volumes"**:
```
Mount Path: /app/sessions
Size: 5GB
```

### 5.4 Deploy

Click en **"Deploy"**

## 🎨 Paso 6: Desplegar Dashboard

### 6.1 Crear Servicio

1. Click en **"Add Service"**
2. Configuración:
   ```
   Name: dashboard
   Type: Dockerfile
   Build Context: ./dashboard
   Dockerfile Path: ./dashboard/Dockerfile
   Port: 3001
   ```

### 6.2 Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
NEXT_PUBLIC_APP_URL=https://dashboard.tudominio.com
NODE_ENV=production
```

### 6.3 Deploy

Click en **"Deploy"**

## 🎯 Paso 7: Desplegar Widget

### 7.1 Crear Servicio

1. Click en **"Add Service"**
2. Configuración:
   ```
   Name: widget
   Type: Dockerfile
   Build Context: ./widget
   Dockerfile Path: ./widget/Dockerfile
   Port: 4321
   ```

### 7.2 Variables de Entorno

```env
PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

### 7.3 Deploy

Click en **"Deploy"**

## 🌐 Paso 8: Configurar Dominios y SSL

### 8.1 Configurar Dominio para Backend API

1. Ve al servicio **backend-api**
2. Click en **"Domains"**
3. Agrega: `api.tudominio.com`
4. Habilita **"Auto SSL"** (Let's Encrypt)
5. Click en **"Save"**

### 8.2 Configurar Dominio para Dashboard

1. Ve al servicio **dashboard**
2. Click en **"Domains"**
3. Agrega: `dashboard.tudominio.com` o `tudominio.com`
4. Habilita **"Auto SSL"**
5. Click en **"Save"**

### 8.3 Configurar Dominio para Widget

1. Ve al servicio **widget**
2. Click en **"Domains"**
3. Agrega: `widget.tudominio.com`
4. Habilita **"Auto SSL"**
5. Click en **"Save"**

### 8.4 Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.), agrega estos registros A:

```
api.tudominio.com      A    IP_DE_TU_SERVIDOR
dashboard.tudominio.com A    IP_DE_TU_SERVIDOR
widget.tudominio.com    A    IP_DE_TU_SERVIDOR
```

## ✅ Paso 9: Verificación

### 9.1 Verificar Backend API

```bash
curl https://api.tudominio.com/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected",
  "redis": "connected"
}
```

### 9.2 Verificar Dashboard

Abre en tu navegador: `https://dashboard.tudominio.com`

Deberías ver la página de login.

### 9.3 Verificar Widget

Abre: `https://widget.tudominio.com`

Deberías ver el widget de chat.

### 9.4 Crear Usuario Admin

En la consola del backend:

```bash
# Accede a la consola de backend-api en Dokploy
npm run prisma:studio
```

O crea un usuario desde el API:

```bash
curl -X POST https://api.tudominio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tudominio.com",
    "password": "TuPasswordSeguro123!",
    "name": "Admin",
    "role": "ADMIN"
  }'
```

## 🔄 Paso 10: Configurar Auto-Deploy (CI/CD)

### 10.1 Habilitar Webhooks

1. En cada servicio en Dokploy, ve a **"Settings"**
2. Habilita **"Auto Deploy on Push"**
3. Copia el **Webhook URL**

### 10.2 Configurar en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Webhooks → Add webhook
3. Payload URL: [Pega el webhook de Dokploy]
4. Content type: `application/json`
5. Events: **"Just the push event"**
6. Click en **"Add webhook"**

Ahora cada vez que hagas push a `main`, Dokploy desplegará automáticamente.

## 📊 Paso 11: Monitoreo

### 11.1 Ver Logs

En Dokploy, cada servicio tiene:
- **Logs**: Ver logs en tiempo real
- **Metrics**: CPU, RAM, Network
- **Console**: Acceso a terminal

### 11.2 Configurar Alertas (Opcional)

1. Ve a **Project Settings**
2. **Notifications**
3. Agrega tu email o webhook de Slack/Discord

## 🔒 Paso 12: Seguridad

### 12.1 Configurar Firewall

En tu servidor VPS:

```bash
# Solo permitir puertos necesarios
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # Dokploy
ufw enable
```

### 12.2 Backups Automáticos

1. En Dokploy, ve a **Databases**
2. Para MySQL, habilita **"Auto Backup"**
3. Frecuencia: Diaria
4. Retención: 7 días

## 🚀 Paso 13: Optimizaciones

### 13.1 Configurar Redis como Caché

Ya está configurado, pero verifica que el backend lo use correctamente.

### 13.2 Configurar Rate Limiting

Ya está en el código del backend (Helmet + express-rate-limit).

### 13.3 Habilitar Compresión

Ya está configurado en el backend (compression middleware).

## 📝 Checklist Final

- [ ] MySQL desplegado y accesible
- [ ] Redis desplegado y accesible
- [ ] Backend API desplegado y respondiendo en `/health`
- [ ] Migraciones ejecutadas
- [ ] WhatsApp QR Service desplegado
- [ ] Dashboard desplegado y accesible
- [ ] Widget desplegado y accesible
- [ ] Dominios configurados con SSL
- [ ] DNS apuntando correctamente
- [ ] Usuario admin creado
- [ ] Auto-deploy configurado
- [ ] Backups configurados
- [ ] Logs verificados sin errores

## 🎉 ¡Listo!

Tu sistema está completamente desplegado en Dokploy.

## 📞 Troubleshooting

### Problema: Backend no conecta a MySQL

**Solución:**
```bash
# Verifica la URL de conexión
# En Dokploy, ve a MySQL → Connection String
# Actualiza DATABASE_URL en backend
```

### Problema: Migraciones fallan

**Solución:**
```bash
# Accede a la consola del backend
npm run prisma:generate
npm run prisma:migrate:deploy --force
```

### Problema: Widget no carga

**Solución:**
- Verifica CORS en backend
- Verifica que `PUBLIC_API_URL` en widget sea correcto
- Revisa logs del widget

### Problema: WhatsApp QR no guarda sesiones

**Solución:**
- Verifica que el volumen esté montado en `/app/sessions`
- Verifica permisos: `chmod 777 /app/sessions`

## 🔗 URLs Finales

Después del despliegue, tendrás:

- **API**: https://api.tudominio.com
- **API Docs**: https://api.tudominio.com/api/docs
- **Dashboard**: https://dashboard.tudominio.com
- **Widget**: https://widget.tudominio.com

## 💡 Próximos Pasos

1. Configura tu primer chatbot
2. Conecta WhatsApp
3. Agrega base de conocimiento
4. Configura pagos (Flow/PayPal)
5. Personaliza el widget
6. ¡Empieza a recibir mensajes!

---

**¿Necesitas ayuda?** Revisa los logs en Dokploy o consulta la documentación del proyecto.
