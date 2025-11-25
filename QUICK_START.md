# ⚡ Inicio Rápido

## ✅ Estado Actual

- ✅ MySQL corriendo en Docker (puerto 3306)
- ✅ Redis corriendo en Docker (puerto 6379)
- ✅ Migraciones de base de datos aplicadas
- ✅ Todos los archivos `.env` configurados
- ✅ Dependencias instaladas
- ✅ Sistema listo para ejecutar

## 🚀 Iniciar el Sistema

### Opción A: Script Automático (Recomendado)
```bash
start-services.bat
```
Esto abrirá 4 terminales automáticamente con cada servicio.

### Opción B: Manual (4 Terminales)

#### Terminal 1: Backend API
```bash
cd backend
npm run start:dev
```
**Espera ver**: `Application is running on: http://localhost:3000`

#### Terminal 2: WhatsApp QR Service
```bash
cd whatsapp-qr-service
npm run dev
```
**Espera ver**: `WhatsApp QR Service running on port 3001`

#### Terminal 3: Dashboard
```bash
cd dashboard
npm run dev
```
**Espera ver**: `ready - started server on 0.0.0.0:3002`

#### Terminal 4: Widget (Opcional)
```bash
cd widget
npm run dev
```
**Espera ver**: `Local: http://localhost:4321/`

## 🌐 URLs

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Dashboard** | http://localhost:3002 | Panel de administración |
| **API** | http://localhost:3000 | API REST |
| **API Docs** | http://localhost:3000/api/docs | Swagger |
| **Health** | http://localhost:3000/health | Estado del sistema |

## 🎯 Primeros Pasos

1. **Abre el dashboard**: http://localhost:3002
2. **Regístrate**: Crea tu cuenta de administrador
3. **Crea un chatbot**: Configura tu primer bot con OpenAI
4. **Prueba**: Envía un mensaje de prueba

## 🛠️ Comandos Útiles

### Verificar configuración
```bash
node verify-setup.js
```

### Ver logs de Docker
```bash
docker logs chatbot-mysql -f
docker logs chatbot-redis -f
```

### Reiniciar Docker
```bash
docker-compose restart mysql redis
```

### Prisma Studio (explorar BD)
```bash
cd backend
npm run prisma:studio
```
Abre: http://localhost:5555

## 📚 Documentación Completa

- **START_LOCAL.md** - Guía detallada de inicio
- **ENV_CONFIGURATION.md** - Configuración de variables de entorno
- **INSTALLATION.md** - Instalación completa
- **README.md** - Documentación general

## ❓ Problemas Comunes

### Backend no inicia
```bash
# Verifica que MySQL y Redis estén corriendo
docker ps | grep chatbot

# Si no están corriendo
docker-compose up -d mysql redis
```

### Error de conexión a MySQL
```bash
# Espera 10 segundos después de iniciar MySQL
timeout /t 10

# Verifica la conexión
docker exec -it chatbot-mysql mysql -u chatbot_user -pchatbot_password -e "SELECT 1;"
```

### Puerto ocupado
```bash
# Encuentra el proceso
netstat -ano | findstr :3000

# Mata el proceso (reemplaza PID)
taskkill /PID <PID> /F
```

## 🎉 ¡Listo!

Tu sistema está configurado y listo para usar. ¡Empieza a desarrollar!
