# Quick Start - Verificación del Sistema

## Verificación Rápida (1 minuto)

```bash
cd backend
npm run verify:system
```

## Checklist de Inicio Rápido

### ✅ Antes de iniciar el backend

- [ ] Redis está corriendo
  ```bash
  redis-cli ping
  # Debe responder: PONG
  ```

- [ ] MySQL está corriendo y la base de datos existe
  ```bash
  mysql -u chatbot_user -p chatbot_saas -e "SELECT 1"
  # Debe ejecutarse sin errores
  ```

- [ ] Variables de entorno configuradas
  ```bash
  # Verificar que existe backend/.env
  cat backend/.env | grep DATABASE_URL
  cat backend/.env | grep REDIS_URL
  cat backend/.env | grep OPENAI_API_KEY
  ```

- [ ] Dependencias instaladas
  ```bash
  cd backend
  npm install
  ```

- [ ] Schema de base de datos migrado
  ```bash
  npm run prisma:migrate
  ```

### ✅ Iniciar el sistema

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2 (opcional): WhatsApp QR Service
cd whatsapp-qr-service
npm run start:dev

# Terminal 3 (opcional): Dashboard
cd dashboard
npm run dev
```

### ✅ Verificar que todo funciona

```bash
# Health check del backend
curl http://localhost:3000/health

# Debe responder con status 200
```

## Solución Rápida de Problemas

### Redis no conecta
```bash
# Iniciar Redis
redis-server

# O con Docker
docker run -d -p 6379:6379 redis:latest
```

### MySQL no conecta
```bash
# Verificar que está corriendo
# Windows: Services -> MySQL
# Linux: sudo systemctl start mysql
# Mac: brew services start mysql

# O con Docker
docker run -d -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=chatbot_saas \
  -e MYSQL_USER=chatbot_user \
  -e MYSQL_PASSWORD=chatbot_password \
  mysql:8.0
```

### Tablas no existen
```bash
cd backend
npm run prisma:migrate
```

### Variables de entorno faltantes
```bash
# Copiar el ejemplo
cp backend/.env.example backend/.env

# Editar y configurar las variables necesarias
# Especialmente: DATABASE_URL, REDIS_URL, OPENAI_API_KEY
```

## Comandos Útiles

```bash
# Verificación completa del sistema
npm run verify:system

# Ver logs del backend
# Los logs aparecen en la consola donde ejecutaste npm run start:dev

# Reiniciar Redis
redis-cli FLUSHALL  # ⚠️ Borra todos los datos

# Ver estado de las colas (cuando el backend esté corriendo)
curl http://localhost:3000/health/queues

# Prisma Studio (interfaz visual de la BD)
npm run prisma:studio
```

## Siguiente Paso

Una vez que la verificación pase sin errores críticos, continuar con:
- **Tarea 2:** Implementar módulo de Health Check
- Ver: `.kiro/specs/fix-chatbot-responses/tasks.md`
