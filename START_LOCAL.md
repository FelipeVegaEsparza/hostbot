# 🚀 Guía de Inicio Rápido - Desarrollo Local

Esta guía te ayudará a ejecutar el sistema en modo desarrollo con MySQL y Redis en Docker, pero los servicios de Node.js corriendo localmente.

## ✅ Prerequisitos Completados

- ✅ MySQL y Redis están corriendo en Docker
- ✅ Migraciones de base de datos aplicadas
- ✅ Dependencias instaladas en todos los servicios

## 📋 Iniciar el Sistema

Necesitas **4 terminales** para ejecutar todos los servicios:

### Terminal 1: Backend API

```bash
cd backend
npm run start:dev
```

**Espera a ver**: `Application is running on: http://localhost:3000`

### Terminal 2: WhatsApp QR Service

```bash
cd whatsapp-qr-service
npm run dev
```

**Espera a ver**: `WhatsApp QR Service running on port 3001`

### Terminal 3: Dashboard (Frontend)

```bash
cd dashboard
npm run dev
```

**Espera a ver**: `ready - started server on 0.0.0.0:3002`

### Terminal 4: Widget (Opcional)

```bash
cd widget
npm run dev
```

**Espera a ver**: `Local: http://localhost:4321/`

## 🌐 URLs del Sistema

Una vez que todos los servicios estén corriendo:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Dashboard** | http://localhost:3002 | Panel de administración |
| **API Backend** | http://localhost:3000 | API REST |
| **API Docs** | http://localhost:3000/api/docs | Documentación Swagger |
| **Health Check** | http://localhost:3000/health | Estado del sistema |
| **WhatsApp QR** | http://localhost:3001 | Servicio de WhatsApp |
| **Widget Demo** | http://localhost:4321 | Widget embebible |

## 🎯 Primeros Pasos

### 1. Registrar un Usuario

Ve a http://localhost:3002 y haz clic en "Registrarse" o usa la API:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "Administrador"
  }'
```

### 2. Iniciar Sesión

Usa las credenciales que acabas de crear para iniciar sesión en el dashboard.

### 3. Crear tu Primer Chatbot

1. Ve a "Chatbots" en el menú lateral
2. Haz clic en "Crear Chatbot"
3. Completa el formulario:
   - **Nombre**: Mi Primer Chatbot
   - **Proveedor de IA**: OpenAI (ya tienes la API key configurada)
   - **Modelo**: gpt-4o-mini
   - **Prompt del Sistema**: "Eres un asistente útil y amigable"
4. Haz clic en "Crear"

### 4. Probar el Chatbot

Puedes probar el chatbot de varias formas:

#### Opción A: Desde la API (Swagger)

1. Ve a http://localhost:3000/api/docs
2. Haz clic en "Authorize" y pega tu token JWT
3. Prueba el endpoint `POST /messages/send`

#### Opción B: Desde el Dashboard

1. Ve a "Conversaciones"
2. Inicia una nueva conversación
3. Envía un mensaje

#### Opción C: Usando el Widget

1. Ve a http://localhost:4321/demo
2. Verás el widget embebido
3. Envía un mensaje de prueba

## 🛠️ Comandos Útiles

### Ver logs de MySQL

```bash
docker logs chatbot-mysql -f
```

### Ver logs de Redis

```bash
docker logs chatbot-redis -f
```

### Reiniciar MySQL y Redis

```bash
docker-compose restart mysql redis
```

### Detener MySQL y Redis

```bash
docker-compose down
```

### Iniciar MySQL y Redis nuevamente

```bash
docker-compose up -d mysql redis
```

### Ejecutar migraciones de base de datos

```bash
cd backend
npm run prisma:migrate
```

### Ver el estado de la base de datos

```bash
cd backend
npm run prisma:studio
```

Esto abrirá una interfaz web en http://localhost:5555 para explorar la base de datos.

## 🐛 Solución de Problemas

### Error: Cannot connect to MySQL

```bash
# Verificar que MySQL esté corriendo
docker ps | grep mysql

# Si no está corriendo, iniciarlo
docker-compose up -d mysql

# Esperar 10 segundos y reintentar
```

### Error: Cannot connect to Redis

```bash
# Verificar que Redis esté corriendo
docker ps | grep redis

# Si no está corriendo, iniciarlo
docker-compose up -d redis
```

### Error: Port already in use

Si algún puerto está ocupado (3000, 3001, 3002, 4321):

```bash
# Windows - Encontrar el proceso
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

### Error: Prisma Client not generated

```bash
cd backend
npm run prisma:generate
```

### El backend no inicia

1. Verifica que MySQL y Redis estén corriendo
2. Verifica que las migraciones estén aplicadas
3. Revisa los logs en `backend/logs/error.log`

### El dashboard muestra error de conexión

1. Verifica que el backend esté corriendo en http://localhost:3000
2. Verifica que el archivo `dashboard/.env` tenga:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

## 📊 Monitoreo

### Ver el estado de las colas (BullMQ)

El backend usa BullMQ para procesar mensajes de forma asíncrona. Puedes monitorear las colas:

1. Instala Bull Board (opcional):
   ```bash
   cd backend
   npm install @bull-board/api @bull-board/express
   ```

2. O usa Redis CLI:
   ```bash
   docker exec -it chatbot-redis redis-cli
   KEYS bull:*
   ```

### Ver métricas de uso

Las métricas se almacenan en la tabla `UsageLog`. Puedes consultarlas con Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

## 🧪 Ejecutar Tests

### Tests Unitarios

```bash
cd backend
npm test
```

### Tests E2E

```bash
cd backend
npm run test:e2e
```

### Tests con Cobertura

```bash
cd backend
npm run test:cov
```

## 🔄 Actualizar el Sistema

Si haces cambios en el código:

### Backend

El modo `start:dev` recarga automáticamente cuando detecta cambios.

### Dashboard

Next.js recarga automáticamente en modo desarrollo.

### WhatsApp QR Service

Reinicia manualmente el servicio (Ctrl+C y volver a ejecutar `npm run dev`).

### Aplicar nuevas migraciones

```bash
cd backend
npm run prisma:migrate
```

## 📝 Notas Importantes

- **API Keys de IA**: Ya tienes configurada la API key de OpenAI. Para usar otros proveedores (Anthropic, Groq, etc.), agrega sus API keys en `backend/.env`

- **WhatsApp**: Para conectar WhatsApp necesitas:
  - **Cloud API**: Configurar una cuenta de WhatsApp Business en Meta
  - **QR (Baileys)**: Escanear el código QR desde el dashboard

- **Producción**: Esta configuración es solo para desarrollo. Para producción, usa Docker Compose completo o sigue la guía en `DEPLOYMENT.md`

## ✅ Checklist de Inicio

- [ ] MySQL y Redis corriendo en Docker
- [ ] Backend API iniciado (Terminal 1)
- [ ] WhatsApp QR Service iniciado (Terminal 2)
- [ ] Dashboard iniciado (Terminal 3)
- [ ] Usuario registrado
- [ ] Primer chatbot creado
- [ ] Mensaje de prueba enviado

## 🎉 ¡Listo!

Tu sistema está corriendo. Ahora puedes:

- Crear múltiples chatbots con diferentes configuraciones
- Conectar WhatsApp Cloud API o QR
- Agregar bases de conocimiento
- Configurar webhooks
- Integrar el widget en tu sitio web
- Monitorear conversaciones en tiempo real

Para más información, consulta:
- `README.md` - Documentación general
- `INSTALLATION.md` - Guía de instalación completa
- `DEPLOYMENT.md` - Guía de despliegue en producción
- `backend/README.md` - Documentación del backend
- `dashboard/README.md` - Documentación del dashboard
