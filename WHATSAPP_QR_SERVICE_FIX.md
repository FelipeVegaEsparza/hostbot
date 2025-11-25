# 🔧 Solución: WhatsApp QR Service Crasheando

## ❌ Problema

El servicio de WhatsApp QR está crasheando con el error:
```
{"level":50,"time":1763654412900,"pid":1616,"hostname":"DESKTOP-USO23CM","msg":"Uncaught exception"}
[nodemon] app crashed - waiting for file changes before starting...
```

## 🔍 Causa

El servicio está intentando importar dependencias que no están instaladas, específicamente:
- `@whiskeysockets/baileys` - Librería de WhatsApp Web
- Otras dependencias del package.json

## ✅ Solución

### Paso 1: Instalar Dependencias

```bash
cd whatsapp-qr-service
npm install
```

Este comando instalará todas las dependencias necesarias:
- `@whiskeysockets/baileys@^6.6.0` - Cliente de WhatsApp Web
- `@hapi/boom@^10.0.1` - Manejo de errores HTTP
- `express@^4.18.2` - Framework web
- `axios@^1.6.5` - Cliente HTTP
- `qrcode@^1.5.3` - Generador de códigos QR
- `pino@^8.17.2` - Logger
- `pino-pretty@^10.3.1` - Formateador de logs
- `dotenv@^16.3.1` - Variables de entorno
- `cors@^2.8.5` - CORS middleware

### Paso 2: Verificar Variables de Entorno

Asegúrate de que el archivo `.env` existe en `whatsapp-qr-service/`:

```env
PORT=3002
NODE_ENV=development
BACKEND_API_URL=http://localhost:3000
SESSIONS_DIR=./sessions
LOG_LEVEL=info
```

### Paso 3: Reiniciar el Servicio

```bash
npm run dev
```

## 📝 Comandos Completos

```bash
# Navegar al directorio
cd whatsapp-qr-service

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

## 🔍 Verificación

Después de instalar las dependencias, deberías ver:

```
[nodemon] starting `ts-node src/index.ts`
{"level":30,"time":...,"msg":"WhatsApp QR Service started on port 3002"}
```

## ⚠️ Problemas Comunes

### 1. Error: Cannot find module '@whiskeysockets/baileys'

**Solución**: Instala las dependencias
```bash
npm install
```

### 2. Error: ENOENT: no such file or directory './sessions'

**Solución**: El directorio se crea automáticamente, pero puedes crearlo manualmente:
```bash
mkdir sessions
```

### 3. Error: Port 3002 already in use

**Solución**: Cambia el puerto en `.env` o mata el proceso:
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

### 4. Error de compilación TypeScript

**Solución**: Asegúrate de tener TypeScript instalado:
```bash
npm install -D typescript ts-node
```

## 📦 Dependencias Principales

### Runtime
- **@whiskeysockets/baileys**: Cliente de WhatsApp Web (Baileys)
- **express**: Framework web para la API REST
- **qrcode**: Generación de códigos QR
- **pino**: Logger de alto rendimiento
- **axios**: Cliente HTTP para comunicarse con el backend

### Development
- **typescript**: Compilador TypeScript
- **ts-node**: Ejecutor de TypeScript
- **nodemon**: Auto-reload en desarrollo
- **@types/***: Definiciones de tipos

## 🚀 Estructura del Servicio

```
whatsapp-qr-service/
├── src/
│   ├── index.ts           # Punto de entrada
│   ├── api.ts             # Endpoints REST
│   ├── sessionManager.ts  # Gestión de sesiones de WhatsApp
│   ├── messageHandler.ts  # Manejo de mensajes
│   ├── events.ts          # Notificaciones de eventos
│   ├── logger.ts          # Configuración de logs
│   └── types.ts           # Tipos TypeScript
├── sessions/              # Datos de sesiones (creado automáticamente)
├── package.json
├── tsconfig.json
└── .env
```

## 🔗 Endpoints Disponibles

Una vez funcionando, el servicio expone:

- `GET /health` - Health check
- `POST /init` - Inicializar sesión de WhatsApp
- `GET /qr-code/:sessionId` - Obtener código QR
- `GET /status/:sessionId` - Estado de la sesión
- `POST /send` - Enviar mensaje
- `POST /disconnect` - Desconectar sesión
- `GET /sessions` - Listar todas las sesiones

## 📊 Logs

El servicio usa Pino para logging. Los logs incluyen:
- Inicio del servicio
- Conexiones de WhatsApp
- Mensajes enviados/recibidos
- Errores y excepciones

## 🔐 Seguridad

- Las sesiones se almacenan localmente en `./sessions`
- Cada sesión tiene su propia carpeta con credenciales
- No se exponen credenciales en los logs
- CORS configurado para el backend

## 📝 Notas

1. **Primera vez**: La instalación de `@whiskeysockets/baileys` puede tardar un poco
2. **Sesiones**: Las sesiones persisten entre reinicios
3. **QR Code**: El código QR expira después de ~20 segundos
4. **Reconexión**: El servicio intenta reconectar automáticamente hasta 5 veces

## ✅ Checklist

- [ ] Navegar a `whatsapp-qr-service/`
- [ ] Ejecutar `npm install`
- [ ] Verificar que `.env` existe
- [ ] Ejecutar `npm run dev`
- [ ] Verificar que el servicio inicia sin errores
- [ ] Probar endpoint de health: `curl http://localhost:3002/health`

---

**Última actualización**: Noviembre 2024
**Estado**: Solución documentada
