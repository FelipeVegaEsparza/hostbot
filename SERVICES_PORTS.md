# 🌐 Puertos de los Servicios

## 📊 Resumen de Puertos

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| **Backend (NestJS)** | 3000 | http://localhost:3000 | 🔴 Requiere MySQL y Redis |
| **Dashboard (Next.js)** | 3001 | http://localhost:3001 | 🟢 Funcionando |
| **Landing (Next.js)** | 3005 | http://localhost:3005 | 🟢 Funcionando |
| **WhatsApp QR Service** | 3002 | http://localhost:3002 | 🟢 Funcionando |
| **Widget (Astro)** | 4321 | http://localhost:4321 | ⚪ No iniciado |

## 🗄️ Servicios de Infraestructura

| Servicio | Puerto | Estado |
|----------|--------|--------|
| **MySQL** | 3306 | 🔴 No corriendo |
| **Redis** | 6379 | 🔴 No corriendo |

## 📝 Detalles por Servicio

### 1. Backend (NestJS API)
- **Puerto**: 3000
- **Archivo**: `backend/.env`
- **Comando**: `cd backend && npm run dev`
- **URL**: http://localhost:3000
- **Endpoints**: 
  - `/api/auth/*` - Autenticación
  - `/api/chatbots/*` - Chatbots
  - `/api/conversations/*` - Conversaciones
  - `/api/admin/*` - Panel de administración
- **Dependencias**: 
  - ✅ MySQL (puerto 3306)
  - ✅ Redis (puerto 6379)
- **Estado**: 🔴 No puede iniciar sin MySQL y Redis

### 2. Dashboard (Next.js)
- **Puerto**: 3001 (configurado en package.json)
- **Archivo**: `dashboard/.env`
- **Comando**: `cd dashboard && npm run dev`
- **URL**: http://localhost:3001
- **Páginas**:
  - `/es/login` - Login
  - `/es/register` - Registro
  - `/es/dashboard` - Dashboard principal
  - `/es/dashboard/admin` - Panel de administración
- **API URL**: http://localhost:3000
- **Estado**: 🟢 Funcionando

### 3. Landing Page (Next.js)
- **Puerto**: 3005
- **Archivo**: `package.json`
- **Comando**: `cd landing && npm run dev`
- **URL**: http://localhost:3005
- **Secciones**:
  - Hero
  - Features
  - Pricing
  - Testimonials
- **Estado**: 🟢 Funcionando

### 4. WhatsApp QR Service (Express + Baileys)
- **Puerto**: 3002
- **Archivo**: `whatsapp-qr-service/.env`
- **Comando**: `cd whatsapp-qr-service && npm run dev`
- **URL**: http://localhost:3002
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /init` - Inicializar sesión
  - `GET /qr-code/:sessionId` - Obtener QR
  - `POST /send` - Enviar mensaje
- **Backend URL**: http://localhost:3000
- **Estado**: 🟢 Funcionando

### 5. Widget (Astro)
- **Puerto**: 4321 (default de Astro)
- **Archivo**: `widget/.env`
- **Comando**: `cd widget && npm run dev`
- **URL**: http://localhost:4321
- **Descripción**: Widget embebible para sitios web
- **API URL**: http://localhost:3000
- **Estado**: ⚪ No iniciado

## ✅ Resolución de Conflictos

### Conflicto Resuelto: Backend y Landing
Anteriormente ambos usaban el puerto 3000.
- **Backend**: Mantiene puerto 3000.
- **Landing**: Movida a puerto 3005.

### Conflicto Resuelto: Dashboard y WhatsApp
Anteriormente conflicto potencial en 3002.
- **Dashboard**: Movido a puerto 3001.
- **WhatsApp**: Mantiene puerto 3002.

## 🚀 Comandos para Iniciar Todos los Servicios

### Opción 1: Iniciar Manualmente (Recomendado)

```bash
# Terminal 1 - Backend (requiere MySQL y Redis)
cd backend
npm run dev

# Terminal 2 - Dashboard
cd dashboard
npm run dev

# Terminal 3 - Landing
cd landing
npm run dev

# Terminal 4 - WhatsApp QR Service
cd whatsapp-qr-service
npm run dev

# Terminal 5 - Widget (opcional)
cd widget
npm run dev
```

### Opción 2: Usando Docker Compose

```bash
# Iniciar todos los servicios con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todos
docker-compose down
```

## 🔧 Configuración de Puertos

### Cambiar Puerto del Backend

Edita `backend/.env`:
```env
PORT=3000
API_PORT=3000
```

### Configuración Actual del Dashboard

En `dashboard/package.json`:
```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

### Configuración Actual de la Landing

En `landing/package.json`:
```json
"scripts": {
  "dev": "next dev -p 3005"
}
```

### Configuración Actual del WhatsApp QR Service

En `whatsapp-qr-service/.env`:
```env
PORT=3002
```

### Cambiar Puerto del Widget

Edita `widget/package.json`:
```json
"scripts": {
  "dev": "astro dev --port 4321"
}
```

## 🔍 Verificar Puertos en Uso

### Windows
```bash
# Ver todos los puertos en uso
netstat -ano | findstr "LISTENING"

# Ver puerto específico
netstat -ano | findstr :3000

# Matar proceso por PID
taskkill /PID <PID> /F
```

### Linux/Mac
```bash
# Ver todos los puertos en uso
lsof -i -P -n | grep LISTEN

# Ver puerto específico
lsof -i :3000

# Matar proceso por puerto
lsof -ti:3000 | xargs kill -9
```

## 📊 Estado Actual de Servicios

Basado en tu configuración actual:

### ✅ Funcionando
- 🟢 **Dashboard**: Puerto 3001
- 🟢 **Landing**: Puerto 3000 (si está corriendo)
- 🟢 **WhatsApp QR Service**: Puerto 3005

### ❌ No Funcionando
- 🔴 **Backend**: Puerto 3000 (requiere MySQL y Redis)
- 🔴 **MySQL**: Puerto 3306 (no está corriendo)
- 🔴 **Redis**: Puerto 6379 (no está corriendo)

### ⚪ No Iniciado
- ⚪ **Widget**: Puerto 4321

## 🔗 URLs de Acceso

### Desarrollo
- **Dashboard**: http://localhost:3001
- **Landing**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **WhatsApp QR**: http://localhost:3005
- **Widget**: http://localhost:4321

### Producción (con Docker)
- **Todo**: http://localhost (Nginx reverse proxy)
- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **WhatsApp QR**: http://localhost:3002
- **Widget**: http://localhost:4321

## 🐳 Puertos en Docker Compose

Según `docker-compose.yml`:

```yaml
services:
  mysql: 3306:3306
  redis: 6379:6379
  api: 3000:3000
  whatsapp-qr-service: 3002:3002
  dashboard: 3001:3001
  widget: 4321:80
  nginx: 80:80, 443:443
```

## 📝 Notas Importantes

1. **Backend y Landing**: Ambos usan puerto 3000, no pueden correr simultáneamente sin cambiar uno
2. **WhatsApp QR Service**: Configurado en puerto 3005 (diferente al 3002 de Docker)
3. **MySQL y Redis**: Deben estar corriendo para que el backend funcione
4. **Dashboard**: Funciona independientemente en puerto 3001

## ✅ Checklist de Servicios

Para tener todo funcionando:

- [ ] MySQL corriendo en puerto 3306
- [ ] Redis corriendo en puerto 6379
- [ ] Backend corriendo en puerto 3000
- [ ] Dashboard corriendo en puerto 3001
- [ ] Landing corriendo en puerto 3000 (o cambiar puerto)
- [ ] WhatsApp QR Service corriendo en puerto 3005
- [ ] Widget corriendo en puerto 4321 (opcional)

---

**Última actualización**: Noviembre 2024
**Configuración**: Desarrollo local
