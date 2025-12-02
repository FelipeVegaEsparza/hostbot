# 🆕 Crear Servicio Nuevo en Dokploy - Guía Paso a Paso

## 🎯 Objetivo
Crear cada servicio desde cero en Dokploy con la configuración correcta.

---

## 📋 Antes de Empezar

### 1. Asegúrate de tener:
- [ ] Proyecto en Dokploy creado
- [ ] Repositorio GitHub conectado
- [ ] MySQL y Redis ya creados y corriendo

### 2. Información que necesitarás:

**URLs de Conexión** (cópialas de Dokploy):
```
MySQL: mysql://chatbot_user:PASSWORD@mysql:3306/chatbot_saas
Redis: redis://redis:6379
```

**API Keys** (prepáralas):
```
JWT_SECRET: [genera uno de 32+ caracteres]
OPENAI_API_KEY: sk-...
```

---

## 🔧 SERVICIO 1: Backend API

### Paso 1: Crear el Servicio

1. En tu proyecto Dokploy, click en **"Add Service"** o **"New Application"**
2. Selecciona **"Application"**
3. Configuración básica:

```
Name: backend-api
Type: Docker
Source: GitHub Repository
```

### Paso 2: Configurar Build

En la sección **"Build Configuration"**:

```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: backend/Dockerfile
```

⚠️ **IMPORTANTE**: 
- Build Context debe ser `.` (solo un punto)
- Dockerfile Path debe ser `backend/Dockerfile` (con la ruta completa)

### Paso 3: Configurar Puerto

```
Container Port: 3000
Published Port: 3000
```

### Paso 4: Variables de Entorno

Click en **"Environment Variables"** y agrega:

```env
# Base de Datos
DATABASE_URL=mysql://chatbot_user:TU_PASSWORD@mysql:3306/chatbot_saas

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=genera-un-secret-muy-seguro-aqui-minimo-32-caracteres
JWT_EXPIRATION=24h

# Aplicación
PORT=3000
NODE_ENV=production
API_URL=https://api.tudominio.com

# CORS
CORS_ORIGINS=https://tudominio.com,https://dashboard.tudominio.com

# OpenAI (REQUERIDO)
OPENAI_API_KEY=sk-tu-api-key-aqui

# WhatsApp QR Service
WHATSAPP_QR_SERVICE_URL=http://whatsapp-qr:3002

# Otros proveedores (OPCIONAL)
ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui
GOOGLE_AI_API_KEY=tu-api-key-aqui
GROQ_API_KEY=gsk_tu-api-key-aqui
```

### Paso 5: Health Check

En **"Health Check"**:

```
Enable Health Check: ✅
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
Start Period: 60s
```

### Paso 6: Recursos

En **"Resources"**:

```
Memory Limit: 1024 MB (1 GB)
CPU Limit: 1000m (1 core)
```

### Paso 7: Deploy

1. Click en **"Create"** o **"Save"**
2. Click en **"Deploy"**
3. Espera 5-10 minutos (el build puede tardar)
4. Ve a **"Logs"** para ver el progreso

### Paso 8: Ejecutar Migraciones

Una vez que el backend esté corriendo:

1. Click en **"Console"** o **"Terminal"**
2. Ejecuta:

```bash
npm run prisma:migrate:deploy
npm run prisma:seed
```

### Paso 9: Verificar

```bash
# En tu navegador o con curl:
https://api.tudominio.com/health

# Debería responder:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## 📱 SERVICIO 2: WhatsApp QR Service

### Paso 1: Crear el Servicio

1. Click en **"Add Service"**
2. Selecciona **"Application"**
3. Configuración básica:

```
Name: whatsapp-qr
Type: Docker
Source: GitHub Repository
```

### Paso 2: Configurar Build

```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: whatsapp-qr-service/Dockerfile
```

### Paso 3: Configurar Puerto

```
Container Port: 3002
Published Port: 3002
```

### Paso 4: Variables de Entorno

```env
PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend-api:3000
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info
```

⚠️ **IMPORTANTE**: `BACKEND_API_URL` debe usar el nombre del servicio backend en Dokploy (ej: `backend-api`)

### Paso 5: Volumen Persistente

En **"Volumes"** o **"Persistent Storage"**:

```
Mount Path: /app/sessions
Size: 5 GB
```

Esto es CRÍTICO para que las sesiones de WhatsApp no se pierdan.

### Paso 6: Health Check (Opcional)

```
Enable Health Check: ✅
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

### Paso 7: Recursos

```
Memory Limit: 512 MB
CPU Limit: 500m
```

### Paso 8: Deploy

1. Click en **"Create"**
2. Click en **"Deploy"**
3. Espera 3-5 minutos
4. Verifica logs

---

## 🎨 SERVICIO 3: Dashboard

### Paso 1: Crear el Servicio

```
Name: dashboard
Type: Docker
Source: GitHub Repository
```

### Paso 2: Configurar Build

```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: dashboard/Dockerfile
```

### Paso 3: Configurar Puerto

```
Container Port: 3001
Published Port: 3001
```

### Paso 4: Variables de Entorno

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
NEXT_PUBLIC_APP_URL=https://dashboard.tudominio.com
NODE_ENV=production
```

⚠️ **IMPORTANTE**: Usa tus dominios reales, no localhost

### Paso 5: Recursos

```
Memory Limit: 512 MB
CPU Limit: 500m
```

### Paso 6: Deploy

1. Click en **"Create"**
2. Click en **"Deploy"**
3. Espera 5-8 minutos (Next.js tarda más)
4. Verifica logs

---

## 🎯 SERVICIO 4: Widget

### Paso 1: Crear el Servicio

```
Name: widget
Type: Docker
Source: GitHub Repository
```

### Paso 2: Configurar Build

```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: widget/Dockerfile
```

### Paso 3: Configurar Puerto

```
Container Port: 80
Published Port: 4321
```

⚠️ **NOTA**: El widget usa nginx que corre en puerto 80 internamente

### Paso 4: Variables de Entorno

```env
PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

### Paso 5: Recursos

```
Memory Limit: 256 MB
CPU Limit: 250m
```

### Paso 6: Deploy

1. Click en **"Create"**
2. Click en **"Deploy"**
3. Espera 3-5 minutos
4. Verifica logs

---

## 🌐 Configurar Dominios

### Para Backend

1. Ve al servicio **backend-api**
2. Click en **"Domains"** o **"Networking"**
3. Click en **"Add Domain"**
4. Configuración:

```
Domain: api.tudominio.com
Enable SSL: ✅
Auto SSL (Let's Encrypt): ✅
```

5. Click en **"Save"**

### Para Dashboard

```
Domain: dashboard.tudominio.com
Enable SSL: ✅
Auto SSL: ✅
```

O si quieres usar el dominio principal:

```
Domain: tudominio.com
Enable SSL: ✅
Auto SSL: ✅
```

### Para Widget

```
Domain: widget.tudominio.com
Enable SSL: ✅
Auto SSL: ✅
```

---

## 🔧 Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.):

```
Tipo  Nombre                  Valor
A     api.tudominio.com       IP_DE_TU_SERVIDOR
A     dashboard.tudominio.com IP_DE_TU_SERVIDOR
A     widget.tudominio.com    IP_DE_TU_SERVIDOR
```

⏱️ **Espera**: Los cambios DNS pueden tardar hasta 48 horas (usualmente 5-30 minutos)

---

## ✅ Verificación Final

### 1. Verificar Estado de Servicios

En Dokploy, todos los servicios deben mostrar:
- Estado: **Running** (verde)
- Health: **Healthy** (si configurado)

### 2. Verificar Endpoints

```bash
# Backend
curl https://api.tudominio.com/health
# Debe responder: {"status":"ok",...}

# Dashboard
curl https://dashboard.tudominio.com
# Debe devolver HTML

# Widget
curl https://widget.tudominio.com
# Debe devolver HTML
```

### 3. Verificar en Navegador

- **Dashboard**: https://dashboard.tudominio.com
  - Debe cargar la página de login
  
- **Widget**: https://widget.tudominio.com
  - Debe cargar el widget de chat

- **API Docs**: https://api.tudominio.com/api/docs
  - Debe cargar Swagger UI

---

## 🐛 Troubleshooting

### Build Falla

**Síntoma**: El build se detiene con error

**Solución**:
1. Ve a **"Logs"** → **"Build Logs"**
2. Lee el error
3. Verifica que:
   - Build Context sea `.`
   - Dockerfile Path sea correcto
   - El Dockerfile exista en el repo

### Contenedor No Inicia

**Síntoma**: Build exitoso pero contenedor no corre

**Solución**:
1. Ve a **"Logs"** → **"Container Logs"**
2. Lee el error
3. Verifica variables de entorno
4. Verifica que las dependencias (MySQL, Redis) estén corriendo

### "Cannot connect to database"

**Solución**:
```
1. Verifica que MySQL esté corriendo
2. Verifica DATABASE_URL
3. Formato correcto: mysql://user:pass@mysql:3306/db
4. Usa el nombre del servicio MySQL en Dokploy
```

### "Cannot connect to Redis"

**Solución**:
```
1. Verifica que Redis esté corriendo
2. Verifica REDIS_URL
3. Formato correcto: redis://redis:6379
4. Usa el nombre del servicio Redis en Dokploy
```

### SSL No Se Genera

**Solución**:
```
1. Verifica que el DNS esté configurado correctamente
2. Espera 10-15 minutos
3. Verifica que el puerto 80 y 443 estén abiertos
4. Intenta regenerar el certificado en Dokploy
```

---

## 📋 Checklist Completo

### Antes de Empezar
- [ ] Proyecto creado en Dokploy
- [ ] Repositorio GitHub conectado
- [ ] MySQL creado y corriendo
- [ ] Redis creado y corriendo
- [ ] API Keys preparadas
- [ ] Dominios apuntando al servidor

### Backend
- [ ] Servicio creado
- [ ] Build Context: `.`
- [ ] Dockerfile Path: `backend/Dockerfile`
- [ ] Puerto: 3000
- [ ] Variables de entorno configuradas
- [ ] Health check configurado
- [ ] Desplegado exitosamente
- [ ] Migraciones ejecutadas
- [ ] `/health` responde OK
- [ ] Dominio configurado
- [ ] SSL habilitado

### WhatsApp QR
- [ ] Servicio creado
- [ ] Build Context: `.`
- [ ] Dockerfile Path: `whatsapp-qr-service/Dockerfile`
- [ ] Puerto: 3002
- [ ] Variables de entorno configuradas
- [ ] Volumen persistente configurado
- [ ] Desplegado exitosamente
- [ ] Logs sin errores

### Dashboard
- [ ] Servicio creado
- [ ] Build Context: `.`
- [ ] Dockerfile Path: `dashboard/Dockerfile`
- [ ] Puerto: 3001
- [ ] Variables de entorno configuradas
- [ ] Desplegado exitosamente
- [ ] Carga en navegador
- [ ] Dominio configurado
- [ ] SSL habilitado

### Widget
- [ ] Servicio creado
- [ ] Build Context: `.`
- [ ] Dockerfile Path: `widget/Dockerfile`
- [ ] Puerto: 80 (interno) / 4321 (externo)
- [ ] Variables de entorno configuradas
- [ ] Desplegado exitosamente
- [ ] Carga en navegador
- [ ] Dominio configurado
- [ ] SSL habilitado

### Final
- [ ] Todos los servicios corriendo
- [ ] Todos los health checks OK
- [ ] Todos los dominios funcionando
- [ ] SSL en todos los dominios
- [ ] Usuario admin creado
- [ ] Primer chatbot creado
- [ ] Todo probado y funcionando

---

## 🎉 ¡Listo!

Si completaste todos los checks, tu sistema está completamente desplegado y funcionando.

## 📞 Próximos Pasos

1. Crear usuario administrador
2. Configurar tu primer chatbot
3. Conectar WhatsApp
4. Personalizar el widget
5. ¡Empezar a recibir mensajes!

---

## 💡 Tips Importantes

### ✅ DO (Hacer)
- ✅ Usa `.` como Build Context siempre
- ✅ Usa rutas completas para Dockerfile Path
- ✅ Verifica logs después de cada deploy
- ✅ Espera a que cada servicio esté healthy antes de continuar
- ✅ Guarda todas las contraseñas de forma segura

### ❌ DON'T (No Hacer)
- ❌ No uses `./nombre-servicio` como Build Context
- ❌ No uses solo `Dockerfile` como path
- ❌ No ignores los errores en los logs
- ❌ No uses contraseñas débiles
- ❌ No compartas tus API keys

---

**Tiempo estimado total**: 1-2 horas

**¿Necesitas ayuda?** Comparte los logs del servicio que falla.
