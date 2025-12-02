# 🚀 Fix Rápido para Dokploy

## 🎯 Problema
Los contenedores no inician después del build en Dokploy.

## ✅ Solución (Ya Aplicada)

Se corrigieron los siguientes archivos:
- ✅ `docker-compose.yml` - Build contexts corregidos
- ✅ `dokploy.json` - Build contexts corregidos
- ✅ `dokploy.yaml` - Creado con configuración correcta
- ✅ `backend/Dockerfile` - Rutas COPY corregidas
- ✅ `whatsapp-qr-service/Dockerfile` - Healthcheck removido

## 📋 Pasos a Seguir en Dokploy

### 1. Push los Cambios
```bash
git push origin main
```

### 2. En Dokploy UI - Para CADA Servicio

#### Backend
1. Ve al servicio "backend" o "backend-api"
2. Click en **"Settings"** o **"Configuration"**
3. Verifica:
   - **Build Context**: `.` (punto, raíz del proyecto)
   - **Dockerfile Path**: `backend/Dockerfile`
4. Click en **"Save"**
5. Click en **"Redeploy"** o **"Rebuild"**
6. Espera a que termine el build (5-10 min)
7. Ve a **"Logs"** y verifica que no haya errores
8. Verifica que el estado sea **"Running"** (verde)

#### WhatsApp QR Service
1. Ve al servicio "whatsapp-qr"
2. Click en **"Settings"**
3. Verifica:
   - **Build Context**: `.`
   - **Dockerfile Path**: `whatsapp-qr-service/Dockerfile`
4. Click en **"Save"**
5. Click en **"Redeploy"**
6. Espera y verifica logs

#### Dashboard
1. Ve al servicio "dashboard"
2. Click en **"Settings"**
3. Verifica:
   - **Build Context**: `.`
   - **Dockerfile Path**: `dashboard/Dockerfile`
4. Click en **"Save"**
5. Click en **"Redeploy"**
6. Espera y verifica logs

#### Widget
1. Ve al servicio "widget"
2. Click en **"Settings"**
3. Verifica:
   - **Build Context**: `.`
   - **Dockerfile Path**: `widget/Dockerfile`
4. Click en **"Save"**
5. Click en **"Redeploy"**
6. Espera y verifica logs

### 3. Verificar Orden de Inicio

Asegúrate de que los servicios inicien en este orden:

```
1. MySQL ✅ (debe estar running)
2. Redis ✅ (debe estar running)
3. Backend ✅ (espera a que esté healthy)
4. WhatsApp QR ✅
5. Dashboard ✅
6. Widget ✅
```

### 4. Verificar Variables de Entorno

#### Backend - Variables Críticas
```env
DATABASE_URL=mysql://chatbot_user:TU_PASSWORD@mysql:3306/chatbot_saas
REDIS_URL=redis://redis:6379
JWT_SECRET=genera-algo-muy-seguro-minimo-32-caracteres
OPENAI_API_KEY=sk-tu-api-key
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://tudominio.com
WHATSAPP_QR_SERVICE_URL=http://whatsapp-qr:3002
```

#### WhatsApp QR Service
```env
PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend:3000
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info
```

#### Dashboard
```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
NODE_ENV=production
```

#### Widget
```env
PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

### 5. Ejecutar Migraciones (Solo Backend)

Una vez que el backend esté corriendo:

1. Ve al servicio **backend**
2. Click en **"Console"** o **"Terminal"**
3. Ejecuta:
```bash
npm run prisma:migrate:deploy
npm run prisma:seed
```

### 6. Verificar que Todo Funcione

#### Desde Dokploy UI
- Todos los servicios deben mostrar estado **"Running"** (verde)
- Los logs no deben mostrar errores críticos

#### Desde tu navegador
```bash
# Backend Health Check
https://api.tudominio.com/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "redis": "connected"
}

# Dashboard
https://dashboard.tudominio.com
# Debería cargar la página de login

# Widget
https://widget.tudominio.com
# Debería cargar el widget
```

## 🔍 Si Algo Falla

### Ver Logs
1. En Dokploy, ve al servicio que falla
2. Click en **"Logs"**
3. Selecciona **"Container Logs"** (no Build Logs)
4. Busca el error

### Errores Comunes

#### "Cannot find module"
- El build no copió los archivos correctamente
- Verifica que el **Build Context** sea `.` (punto)

#### "Database connection failed"
- Verifica que MySQL esté corriendo
- Verifica que `DATABASE_URL` sea correcta
- Formato: `mysql://user:password@mysql:3306/database`

#### "Redis connection failed"
- Verifica que Redis esté corriendo
- Verifica que `REDIS_URL` sea correcta
- Formato: `redis://redis:6379`

#### "Port already in use"
- Otro servicio está usando el mismo puerto
- Verifica que cada servicio tenga su puerto único

## 📞 Checklist Final

Después de re-desplegar, verifica:

- [ ] MySQL está corriendo (verde)
- [ ] Redis está corriendo (verde)
- [ ] Backend está corriendo (verde)
- [ ] Backend responde en `/health`
- [ ] WhatsApp QR está corriendo (verde)
- [ ] Dashboard está corriendo (verde)
- [ ] Dashboard carga en el navegador
- [ ] Widget está corriendo (verde)
- [ ] Widget carga en el navegador
- [ ] Migraciones ejecutadas
- [ ] No hay errores en los logs

## 🎉 ¡Listo!

Si todos los checks están ✅, tu sistema está funcionando correctamente en Dokploy.

## 📚 Más Información

- Ver `DOKPLOY_TROUBLESHOOTING.md` para problemas detallados
- Ver `DOKPLOY_DEPLOYMENT.md` para la guía completa
- Ver `DOKPLOY_CHECKLIST.md` para el checklist completo

---

**Tiempo estimado**: 30-45 minutos para re-desplegar todo

**¿Necesitas ayuda?** Comparte los logs del servicio que falla.
