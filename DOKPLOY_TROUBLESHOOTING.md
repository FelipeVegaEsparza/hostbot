# 🔧 Dokploy - Solución de Problemas

## ⚠️ Problema: Contenedores no inician después del build

### Síntomas
- El build se completa exitosamente
- Los contenedores no inician automáticamente
- El estado muestra "0" (no corriendo)

### Causa Raíz
Dokploy puede tener problemas con:
1. Contextos de build incorrectos en `docker-compose.yml` o `dokploy.json`
2. Healthchecks que fallan
3. CMD o ENTRYPOINT incorrectos en Dockerfiles

### ✅ Solución Aplicada

#### 1. Corregir Build Contexts

**Antes (❌ Incorrecto)**:
```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
```

**Después (✅ Correcto)**:
```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
```

#### 2. Simplificar Dockerfiles

**WhatsApp QR Service - Antes**:
```dockerfile
# Tenía healthcheck que podía fallar
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', ...)"
```

**WhatsApp QR Service - Después**:
```dockerfile
# Sin healthcheck en Dockerfile (Dokploy lo maneja)
CMD ["node", "dist/index.js"]
```

#### 3. Verificar CMD en todos los Dockerfiles

**Backend**:
```dockerfile
CMD ["npm", "run", "start:prod"]
```

**WhatsApp QR Service**:
```dockerfile
CMD ["node", "dist/index.js"]
```

**Dashboard**:
```dockerfile
CMD ["npm", "run", "start"]
```

**Widget**:
```dockerfile
CMD ["nginx", "-g", "daemon off;"]
```

### 📋 Checklist de Verificación

Antes de hacer push a Dokploy, verifica:

- [ ] Todos los `build.context` apuntan a `.` (raíz del proyecto)
- [ ] Todos los `dockerfile` tienen la ruta completa (ej: `backend/Dockerfile`)
- [ ] Los Dockerfiles NO tienen HEALTHCHECK (Dokploy lo maneja)
- [ ] Los Dockerfiles tienen CMD correcto
- [ ] Las rutas COPY en Dockerfiles son correctas

### 🔍 Cómo Verificar en Dokploy

#### 1. Verificar Logs del Build
```bash
# En Dokploy UI:
1. Ve al servicio (ej: backend)
2. Click en "Logs"
3. Selecciona "Build Logs"
4. Busca errores
```

#### 2. Verificar Logs del Contenedor
```bash
# En Dokploy UI:
1. Ve al servicio
2. Click en "Logs"
3. Selecciona "Container Logs"
4. Verifica que el servicio inicie correctamente
```

#### 3. Verificar Variables de Entorno
```bash
# En Dokploy UI:
1. Ve al servicio
2. Click en "Environment"
3. Verifica que todas las variables estén configuradas
```

### 🚀 Pasos para Re-desplegar

#### 1. Hacer Commit de los Cambios
```bash
git add docker-compose.yml dokploy.json dokploy.yaml
git add backend/Dockerfile whatsapp-qr-service/Dockerfile
git commit -m "fix: Correct Dokploy build contexts and simplify Dockerfiles"
git push origin main
```

#### 2. En Dokploy UI

**Para cada servicio**:

1. **Backend**:
   - Ve a "Settings"
   - Verifica "Build Context": `.`
   - Verifica "Dockerfile Path": `backend/Dockerfile`
   - Click en "Redeploy"

2. **WhatsApp QR Service**:
   - Ve a "Settings"
   - Verifica "Build Context": `.`
   - Verifica "Dockerfile Path": `whatsapp-qr-service/Dockerfile`
   - Click en "Redeploy"

3. **Dashboard**:
   - Ve a "Settings"
   - Verifica "Build Context": `.`
   - Verifica "Dockerfile Path": `dashboard/Dockerfile`
   - Click en "Redeploy"

4. **Widget**:
   - Ve a "Settings"
   - Verifica "Build Context": `.`
   - Verifica "Dockerfile Path": `widget/Dockerfile`
   - Click en "Redeploy"

### 🔄 Orden de Despliegue Recomendado

```
1. MySQL (debe estar corriendo)
   ↓
2. Redis (debe estar corriendo)
   ↓
3. Backend (espera a que esté healthy)
   ↓
4. WhatsApp QR Service
   ↓
5. Dashboard
   ↓
6. Widget
```

### 🩺 Health Checks en Dokploy

Configura los health checks en Dokploy UI (no en Dockerfile):

**Backend**:
```
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

**WhatsApp QR Service**:
```
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

### 🐛 Problemas Comunes y Soluciones

#### Problema: "Cannot find module"
**Causa**: `npm install` no se ejecutó correctamente
**Solución**:
```dockerfile
# Asegúrate de tener esto en el Dockerfile
COPY package*.json ./
RUN npm ci  # o npm install
COPY . .
```

#### Problema: "Prisma Client not generated"
**Causa**: `prisma generate` no se ejecutó
**Solución**:
```dockerfile
# En backend/Dockerfile
RUN npm run prisma:generate
RUN npm run build
```

#### Problema: "Port already in use"
**Causa**: Otro contenedor usa el mismo puerto
**Solución**:
- Verifica que cada servicio use un puerto único
- Backend: 3000
- Dashboard: 3001
- WhatsApp QR: 3002
- Widget: 4321

#### Problema: "Database connection failed"
**Causa**: DATABASE_URL incorrecta o MySQL no está corriendo
**Solución**:
```bash
# Verifica en Dokploy:
1. MySQL está corriendo (estado: running)
2. DATABASE_URL en backend es correcta
3. Formato: mysql://user:password@mysql:3306/database
```

#### Problema: "Redis connection failed"
**Causa**: REDIS_URL incorrecta o Redis no está corriendo
**Solución**:
```bash
# Verifica en Dokploy:
1. Redis está corriendo (estado: running)
2. REDIS_URL en backend es correcta
3. Formato: redis://redis:6379
```

### 📊 Verificar Estado de Servicios

#### Desde Dokploy UI
```
1. Ve a tu proyecto
2. Verifica que todos los servicios muestren:
   - Estado: Running (verde)
   - Health: Healthy (si configurado)
   - Uptime: > 0s
```

#### Desde Terminal (si tienes acceso SSH)
```bash
# Ver contenedores corriendo
docker ps

# Ver logs de un servicio
docker logs chatbot-api

# Ver logs en tiempo real
docker logs -f chatbot-api
```

### 🔐 Variables de Entorno Críticas

Asegúrate de tener configuradas:

**Backend**:
```env
DATABASE_URL=mysql://chatbot_user:PASSWORD@mysql:3306/chatbot_saas
REDIS_URL=redis://redis:6379
JWT_SECRET=tu-secret-muy-seguro-minimo-32-caracteres
OPENAI_API_KEY=sk-...
PORT=3000
NODE_ENV=production
```

**WhatsApp QR Service**:
```env
PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend:3000
SESSIONS_DIR=/app/sessions
```

**Dashboard**:
```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

**Widget**:
```env
PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

### 🎯 Comando de Verificación Rápida

Después de desplegar, ejecuta esto en la consola del backend:

```bash
# Verificar conexión a base de datos
npm run prisma:studio

# Ejecutar migraciones (si no se ejecutaron)
npm run prisma:migrate:deploy

# Crear seed data
npm run prisma:seed
```

### 📞 Si Nada Funciona

1. **Elimina todos los servicios en Dokploy**
2. **Elimina el proyecto**
3. **Crea el proyecto de nuevo**
4. **Sigue la guía paso a paso desde cero**

### ✅ Verificación Final

Después de re-desplegar, verifica:

```bash
# Backend Health
curl https://api.tudominio.com/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected",
  "redis": "connected"
}

# Dashboard
curl https://dashboard.tudominio.com
# Debería devolver HTML

# Widget
curl https://widget.tudominio.com
# Debería devolver HTML
```

### 📝 Resumen de Cambios Aplicados

1. ✅ Corregido `docker-compose.yml` - build contexts
2. ✅ Corregido `dokploy.json` - build contexts
3. ✅ Creado `dokploy.yaml` con configuración correcta
4. ✅ Simplificado `whatsapp-qr-service/Dockerfile` - removido healthcheck
5. ✅ Corregido `backend/Dockerfile` - rutas de COPY

### 🚀 Próximos Pasos

1. Hacer commit y push de los cambios
2. En Dokploy, re-desplegar cada servicio
3. Verificar logs de cada servicio
4. Verificar health checks
5. Probar endpoints

---

**¿Sigues teniendo problemas?**

Comparte:
- Logs del build
- Logs del contenedor
- Variables de entorno configuradas
- Mensaje de error específico

