# 🚀 Guía de Despliegue a Easypanel

Esta guía te ayudará a desplegar el proyecto completo en Easypanel con despliegue automático desde GitHub.

## 📋 Prerequisitos

1. ✅ Cuenta en [Easypanel](https://easypanel.io)
2. ✅ Cuenta en [GitHub](https://github.com)
3. ✅ Repositorio de GitHub creado
4. ✅ Proyecto inicializado en Git

---

## 🔧 Paso 1: Preparar el Repositorio en GitHub

### 1.1 Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `chatbot-saas` (o el que prefieras)
3. Descripción: "Plataforma SaaS de Chatbots con IA"
4. Privado o Público (recomendado: Privado)
5. **NO** inicialices con README, .gitignore o licencia
6. Clic en "Create repository"

### 1.2 Subir el Código

```bash
# Ya inicializaste git, ahora agrega los archivos
git add .

# Commit inicial
git commit -m "Initial commit: Chatbot SaaS Platform with AI"

# Agrega el remote (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/chatbot-saas.git

# Renombra la rama a main (si es necesario)
git branch -M main

# Push al repositorio
git push -u origin main
```

---

## 🌐 Paso 2: Configurar Easypanel

### 2.1 Crear Proyecto en Easypanel

1. Inicia sesión en Easypanel
2. Clic en "New Project"
3. Nombre: `chatbot-saas`
4. Clic en "Create"

### 2.2 Conectar GitHub

1. Ve a Settings → Integrations
2. Conecta tu cuenta de GitHub
3. Autoriza acceso al repositorio `chatbot-saas`

### 2.3 Configurar Variables de Entorno

En Easypanel, ve a tu proyecto y agrega estas variables de entorno:

#### Variables Globales del Proyecto

```env
# GitHub
GITHUB_REPO=TU_USUARIO/chatbot-saas

# Dominios (reemplaza con tus dominios reales)
API_DOMAIN=api.tudominio.com
DASHBOARD_DOMAIN=dashboard.tudominio.com
LANDING_DOMAIN=tudominio.com
WIDGET_DOMAIN=widget.tudominio.com

# URLs
API_URL=https://api.tudominio.com
FRONTEND_URL=https://dashboard.tudominio.com

# Base de Datos
MYSQL_ROOT_PASSWORD=tu_password_root_seguro
MYSQL_PASSWORD=tu_password_mysql_seguro

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_cambialo

# OpenAI (requerido)
OPENAI_API_KEY=sk-...

# Otros proveedores de IA (opcional)
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GOOGLE_AI_API_KEY=...
MISTRAL_API_KEY=...
COHERE_API_KEY=...

# WhatsApp (opcional)
WHATSAPP_APP_SECRET=tu_app_secret
WHATSAPP_VERIFY_TOKEN=tu_verify_token

# Pagos (opcional)
FLOW_API_KEY=...
FLOW_SECRET_KEY=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
```

---

## 📦 Paso 3: Desplegar Servicios

### 3.1 Desplegar MySQL

1. En Easypanel, clic en "Add Service"
2. Selecciona "MySQL"
3. Nombre: `chatbot-mysql`
4. Versión: `8.0`
5. Database: `chatbot_saas`
6. Username: `chatbot_user`
7. Password: Usa `${MYSQL_PASSWORD}`
8. Clic en "Deploy"

### 3.2 Desplegar Redis

1. Clic en "Add Service"
2. Selecciona "Redis"
3. Nombre: `chatbot-redis`
4. Versión: `7-alpine`
5. Clic en "Deploy"

### 3.3 Desplegar Backend API

1. Clic en "Add Service" → "App"
2. Nombre: `chatbot-backend`
3. Source:
   - Type: GitHub
   - Repository: `TU_USUARIO/chatbot-saas`
   - Branch: `main`
   - Path: `/backend`
4. Build:
   - Type: Dockerfile
   - Dockerfile path: `Dockerfile`
5. Environment Variables:
   ```
   DATABASE_URL=mysql://chatbot_user:${MYSQL_PASSWORD}@chatbot-mysql:3306/chatbot_saas
   REDIS_URL=redis://chatbot-redis:6379
   JWT_SECRET=${JWT_SECRET}
   NODE_ENV=production
   ALLOWED_ORIGINS=${FRONTEND_URL}
   OPENAI_API_KEY=${OPENAI_API_KEY}
   ```
6. Port: `3000`
7. Domain: `${API_DOMAIN}`
8. Health Check: `/health`
9. Clic en "Deploy"

**Importante:** Espera a que el backend esté corriendo antes de continuar.

### 3.4 Ejecutar Migraciones

Una vez que el backend esté corriendo:

1. Ve al servicio `chatbot-backend`
2. Abre la terminal (Console)
3. Ejecuta:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run seed
   ```

### 3.5 Desplegar WhatsApp QR Service

1. Clic en "Add Service" → "App"
2. Nombre: `chatbot-whatsapp-qr`
3. Source: GitHub → `TU_USUARIO/chatbot-saas` → `/whatsapp-qr-service`
4. Build: Dockerfile
5. Environment Variables:
   ```
   PORT=3002
   NODE_ENV=production
   BACKEND_API_URL=http://chatbot-backend:3000
   ```
6. Port: `3002`
7. Volume: Mount `/app/sessions` para persistir sesiones
8. Clic en "Deploy"

### 3.6 Desplegar Dashboard

1. Clic en "Add Service" → "App"
2. Nombre: `chatbot-dashboard`
3. Source: GitHub → `TU_USUARIO/chatbot-saas` → `/dashboard`
4. Build: Dockerfile
5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=${API_URL}
   NODE_ENV=production
   ```
6. Port: `3001`
7. Domain: `${DASHBOARD_DOMAIN}`
8. Clic en "Deploy"

### 3.7 Desplegar Landing Page (Opcional)

1. Clic en "Add Service" → "App"
2. Nombre: `chatbot-landing`
3. Source: GitHub → `TU_USUARIO/chatbot-saas` → `/landing`
4. Build: Dockerfile
5. Port: `3005`
6. Domain: `${LANDING_DOMAIN}`
7. Clic en "Deploy"

### 3.8 Desplegar Widget (Opcional)

1. Clic en "Add Service" → "App"
2. Nombre: `chatbot-widget`
3. Source: GitHub → `TU_USUARIO/chatbot-saas` → `/widget`
4. Build: Dockerfile
5. Port: `4321` (target: `80`)
6. Domain: `${WIDGET_DOMAIN}`
7. Clic en "Deploy"

---

## 🔄 Paso 4: Configurar Despliegue Automático

### 4.1 GitHub Actions

El archivo `.github/workflows/deploy.yml` ya está configurado.

### 4.2 Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Clic en "New repository secret"
4. Agrega estos secrets:

```
EASYPANEL_URL=https://tu-easypanel-url.com
EASYPANEL_TOKEN=tu_token_de_easypanel
```

Para obtener el token de Easypanel:
1. Ve a Easypanel → Settings → API Tokens
2. Clic en "Create Token"
3. Copia el token

### 4.3 Habilitar Auto-Deploy

En Easypanel, para cada servicio:
1. Ve a Settings del servicio
2. Habilita "Auto Deploy"
3. Branch: `main`

---

## 🧪 Paso 5: Verificar Despliegue

### 5.1 Verificar Servicios

Verifica que todos los servicios estén corriendo:

```bash
# Health check del backend
curl https://api.tudominio.com/health

# Debería responder:
# {"status":"ok","info":{...}}
```

### 5.2 Acceder al Dashboard

1. Ve a `https://dashboard.tudominio.com`
2. Login con:
   - Email: `admin@chatbot.com`
   - Password: `Admin123!`

### 5.3 Verificar Logs

En Easypanel, revisa los logs de cada servicio para asegurarte de que no haya errores.

---

## 🔒 Paso 6: Configurar SSL/HTTPS

Easypanel maneja SSL automáticamente con Let's Encrypt:

1. Ve a cada servicio
2. Settings → Domains
3. Habilita "SSL/TLS"
4. Easypanel generará automáticamente el certificado

---

## 📊 Paso 7: Monitoreo

### 7.1 Logs

En Easypanel, cada servicio tiene:
- Logs en tiempo real
- Métricas de CPU/RAM
- Historial de despliegues

### 7.2 Health Checks

El backend tiene un endpoint `/health` que Easypanel usa para monitoreo.

---

## 🔄 Actualizar el Proyecto

### Despliegue Automático

Cada vez que hagas push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

GitHub Actions desplegará automáticamente a Easypanel.

### Despliegue Manual

En Easypanel:
1. Ve al servicio
2. Clic en "Redeploy"

---

## 🐛 Solución de Problemas

### Error: Cannot connect to database

1. Verifica que MySQL esté corriendo
2. Verifica la variable `DATABASE_URL`
3. Revisa los logs de MySQL

### Error: Redis connection failed

1. Verifica que Redis esté corriendo
2. Verifica la variable `REDIS_URL`

### Error: Migrations not applied

```bash
# En la terminal del backend
npx prisma migrate deploy
```

### Error: 502 Bad Gateway

1. Verifica que el servicio esté corriendo
2. Revisa los logs del servicio
3. Verifica el health check

---

## 📝 Checklist de Despliegue

- [ ] Repositorio creado en GitHub
- [ ] Código subido a GitHub
- [ ] Proyecto creado en Easypanel
- [ ] GitHub conectado a Easypanel
- [ ] Variables de entorno configuradas
- [ ] MySQL desplegado
- [ ] Redis desplegado
- [ ] Backend desplegado
- [ ] Migraciones ejecutadas
- [ ] WhatsApp Service desplegado
- [ ] Dashboard desplegado
- [ ] Landing desplegado (opcional)
- [ ] Widget desplegado (opcional)
- [ ] SSL configurado
- [ ] Auto-deploy habilitado
- [ ] Health checks funcionando
- [ ] Login exitoso en dashboard

---

## 🎉 ¡Listo!

Tu plataforma de chatbots está desplegada y lista para usar.

**Próximos pasos:**
1. Cambia la contraseña del admin
2. Crea tu primer chatbot
3. Configura WhatsApp
4. Personaliza el branding

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Easypanel
2. Verifica las variables de entorno
3. Consulta la documentación de Easypanel
