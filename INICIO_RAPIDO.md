# 🚀 Guía Rápida: Levantar el Proyecto en Local

## Paso 1: Verificar Prerequisitos

Asegúrate de tener instalado:
- ✅ Node.js (v18 o superior)
- ✅ Docker Desktop (para MySQL y Redis)
- ✅ Git

## Paso 2: Iniciar MySQL y Redis

Abre una terminal en la carpeta raíz del proyecto (`f:/chatbot`) y ejecuta:

```powershell
docker-compose up -d mysql redis
```

**Espera 10-15 segundos** para que MySQL y Redis inicien completamente.

Verifica que estén corriendo:
```powershell
docker ps
```

Deberías ver `chatbot-mysql` y `chatbot-redis` en la lista.

## Paso 3: Configurar Variables de Entorno

### Backend

Si no existe el archivo `.env` en `backend/`:

```powershell
cd backend
copy .env.example .env
```

Edita `backend/.env` y asegúrate de tener al menos:
```env
DATABASE_URL="mysql://chatbot_user:chatbot_password@localhost:3306/chatbot_saas"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="tu-secreto-super-seguro-cambialo-en-produccion"
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:4321"
OPENAI_API_KEY="tu-api-key-de-openai"  # Opcional pero recomendado
```

### Dashboard

```powershell
cd ../dashboard
copy .env.example .env
```

Edita `dashboard/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Paso 4: Instalar Dependencias (si no lo has hecho)

```powershell
# Desde la raíz del proyecto
cd backend
npm install

cd ../dashboard
npm install

cd ../whatsapp-qr-service
npm install

cd ../widget
npm install
```

## Paso 5: Aplicar Migraciones de Base de Datos

```powershell
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Paso 6: Levantar los Servicios

Necesitas **4 terminales** (PowerShell o CMD):

### Terminal 1: Backend API
```powershell
cd f:/chatbot/backend
npm run start:dev
```
✅ **Espera ver:** `Application is running on: http://localhost:3000`

### Terminal 2: WhatsApp QR Service
```powershell
cd f:/chatbot/whatsapp-qr-service
npm run dev
```
✅ **Espera ver:** `WhatsApp QR Service running on port 3002`

### Terminal 3: Dashboard
```powershell
cd f:/chatbot/dashboard
npm run dev
```
✅ **Espera ver:** `ready - started server on 0.0.0.0:3001`

### Terminal 4: Widget (Opcional)
```powershell
cd f:/chatbot/widget
npm run dev
```
✅ **Espera ver:** `Local: http://localhost:4321/`

## Paso 7: Acceder al Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Dashboard** | http://localhost:3001 | Panel de administración |
| **API** | http://localhost:3000 | Backend API |
| **Swagger Docs** | http://localhost:3000/api/docs | Documentación de la API |
| **Widget Demo** | http://localhost:4321 | Widget embebible |

## Paso 8: Crear tu Primera Cuenta

1. Ve a http://localhost:3001
2. Haz clic en "Registrarse"
3. Completa el formulario:
   - Email: `admin@test.com`
   - Contraseña: `Admin123!`
   - Nombre: `Administrador`
4. Inicia sesión con esas credenciales

## Paso 9: Crear tu Primer Chatbot

1. En el dashboard, ve a "Chatbots"
2. Clic en "Crear Chatbot"
3. Completa:
   - **Nombre:** Mi Primer Bot
   - **Proveedor de IA:** OpenAI
   - **Modelo:** gpt-4o-mini
   - **System Prompt:** "Eres un asistente útil"
4. Clic en "Crear"

## Paso 10: Probar el Human Handoff (Nueva Funcionalidad)

### Desde Swagger (http://localhost:3000/api/docs):

1. **Authorize** con tu token JWT
2. **Crear conversación:** `POST /conversations`
3. **Enviar mensaje:** `POST /messages/send`
4. **Tomar control:** `POST /conversations/{id}/takeover`
5. **Enviar como agente:** `POST /messages/agent-send`
6. **Liberar control:** `POST /conversations/{id}/release`

## 🛠️ Comandos Útiles

### Ver logs de MySQL
```powershell
docker logs chatbot-mysql -f
```

### Ver logs de Redis
```powershell
docker logs chatbot-redis -f
```

### Reiniciar base de datos
```powershell
docker-compose restart mysql redis
```

### Ver base de datos (Prisma Studio)
```powershell
cd backend
npx prisma studio
```
Abre http://localhost:5555

### Detener todo
```powershell
# Detener servicios Node.js: Ctrl+C en cada terminal
# Detener Docker:
docker-compose down
```

## 🐛 Solución de Problemas Comunes

### Error: "Cannot connect to MySQL"
```powershell
docker-compose up -d mysql
# Espera 15 segundos
docker logs chatbot-mysql
```

### Error: "Port 3000 already in use"
```powershell
# Encontrar el proceso
netstat -ano | findstr :3000
# Matar el proceso (reemplaza PID)
taskkill /PID <PID> /F
```

### Error: "Prisma Client not generated"
```powershell
cd backend
npx prisma generate
```

### El dashboard no se conecta al backend
Verifica que `dashboard/.env` tenga:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## ✅ Checklist de Inicio

- [ ] MySQL y Redis corriendo en Docker
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas
- [ ] Backend corriendo (Terminal 1)
- [ ] WhatsApp Service corriendo (Terminal 2)
- [ ] Dashboard corriendo (Terminal 3)
- [ ] Cuenta de usuario creada
- [ ] Primer chatbot creado
- [ ] Mensaje de prueba enviado

## 🎉 ¡Listo!

Tu sistema está corriendo localmente. Ahora puedes:
- ✅ Crear chatbots con diferentes modelos de IA
- ✅ Usar la nueva funcionalidad de **Human Handoff**
- ✅ Conectar WhatsApp
- ✅ Probar el widget embebible
- ✅ Ver conversaciones en tiempo real

**Nota:** Los puertos han sido actualizados según `SERVICES_PORTS.md`:
- Backend: 3000
- Dashboard: 3001
- WhatsApp Service: 3002
- Landing Page: 3005
- Widget: 4321
