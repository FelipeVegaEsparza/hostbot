# 📋 Dokploy - Valores para Copiar y Pegar

## 🎯 Usa esta guía para copiar y pegar los valores exactos en Dokploy

---

## 🔧 BACKEND API

### Build Configuration
```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: backend/Dockerfile
```

### Port Configuration
```
Container Port: 3000
Published Port: 3000
```

### Environment Variables
```env
DATABASE_URL=mysql://chatbot_user:TU_PASSWORD_AQUI@mysql:3306/chatbot_saas
REDIS_URL=redis://redis:6379
JWT_SECRET=GENERA_UN_SECRET_SEGURO_DE_32_CARACTERES_MINIMO
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=production
API_URL=https://api.tudominio.com
CORS_ORIGINS=https://tudominio.com,https://dashboard.tudominio.com
OPENAI_API_KEY=sk-TU_API_KEY_AQUI
WHATSAPP_QR_SERVICE_URL=http://whatsapp-qr:3002
```

### Health Check
```
Path: /health
Interval: 30
Timeout: 10
Retries: 3
Start Period: 60
```

### Resources
```
Memory: 1024 MB
CPU: 1000m
```

---

## 📱 WHATSAPP QR SERVICE

### Build Configuration
```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: whatsapp-qr-service/Dockerfile
```

### Port Configuration
```
Container Port: 3002
Published Port: 3002
```

### Environment Variables
```env
PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend-api:3000
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info
```

### Volume
```
Mount Path: /app/sessions
Size: 5 GB
```

### Resources
```
Memory: 512 MB
CPU: 500m
```

---

## 🎨 DASHBOARD

### Build Configuration
```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: dashboard/Dockerfile
```

### Port Configuration
```
Container Port: 3001
Published Port: 3001
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
NEXT_PUBLIC_APP_URL=https://dashboard.tudominio.com
NODE_ENV=production
```

### Resources
```
Memory: 512 MB
CPU: 500m
```

---

## 🎯 WIDGET

### Build Configuration
```
Build Type: Dockerfile
Build Context: .
Dockerfile Path: widget/Dockerfile
```

### Port Configuration
```
Container Port: 80
Published Port: 4321
```

### Environment Variables
```env
PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
```

### Resources
```
Memory: 256 MB
CPU: 250m
```

---

## 🌐 DOMINIOS

### Backend
```
Domain: api.tudominio.com
SSL: Enabled
Auto SSL: Enabled
```

### Dashboard
```
Domain: dashboard.tudominio.com
SSL: Enabled
Auto SSL: Enabled
```

### Widget
```
Domain: widget.tudominio.com
SSL: Enabled
Auto SSL: Enabled
```

---

## 🔑 GENERAR JWT_SECRET

Usa uno de estos métodos:

### Método 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Método 2: OpenSSL
```bash
openssl rand -hex 32
```

### Método 3: Online
Visita: https://generate-secret.vercel.app/32

---

## 📝 COMANDOS POST-DEPLOY

### Después de desplegar Backend

Ejecuta en la consola del backend:

```bash
npm run prisma:migrate:deploy
npm run prisma:seed
```

---

## ✅ VERIFICACIÓN

### Backend Health Check
```bash
curl https://api.tudominio.com/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "connected",
  "redis": "connected"
}
```

### Dashboard
```bash
curl https://dashboard.tudominio.com
```

Debe devolver HTML

### Widget
```bash
curl https://widget.tudominio.com
```

Debe devolver HTML

---

## 🎯 ORDEN DE CREACIÓN

1. ✅ MySQL (primero)
2. ✅ Redis (segundo)
3. ✅ Backend (tercero - espera a que esté healthy)
4. ✅ WhatsApp QR (cuarto)
5. ✅ Dashboard (quinto)
6. ✅ Widget (sexto)

---

## ⚠️ IMPORTANTE

### Build Context
- ✅ SIEMPRE usa: `.` (solo un punto)
- ❌ NUNCA uses: `./backend` o `./whatsapp-qr-service`

### Dockerfile Path
- ✅ SIEMPRE usa la ruta completa: `backend/Dockerfile`
- ❌ NUNCA uses solo: `Dockerfile`

### Nombres de Servicios
En las variables de entorno, usa los nombres exactos de los servicios en Dokploy:
- `mysql` (nombre del servicio MySQL)
- `redis` (nombre del servicio Redis)
- `backend-api` (nombre del servicio Backend)
- `whatsapp-qr` (nombre del servicio WhatsApp)

---

## 🔄 SI ALGO FALLA

### Ver Logs
```
1. Ve al servicio en Dokploy
2. Click en "Logs"
3. Selecciona "Container Logs"
4. Lee el error
```

### Rebuild
```
1. Ve al servicio
2. Click en "Redeploy" o "Rebuild"
3. Espera a que termine
4. Verifica logs
```

### Restart
```
1. Ve al servicio
2. Click en "Restart"
3. Espera 30 segundos
4. Verifica estado
```

---

## 📞 CHECKLIST RÁPIDO

Antes de crear cada servicio, verifica:

- [ ] Build Context es `.`
- [ ] Dockerfile Path es correcto
- [ ] Puerto es correcto
- [ ] Variables de entorno están completas
- [ ] Nombres de servicios son correctos
- [ ] Recursos están configurados

---

**¡Copia y pega estos valores exactos en Dokploy!**

No modifiques nada excepto:
- `TU_PASSWORD_AQUI`
- `TU_API_KEY_AQUI`
- `tudominio.com`
- Nombres de servicios (si usaste nombres diferentes)
