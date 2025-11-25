# Guía de Instalación

Esta guía te ayudará a instalar y configurar el SaaS de Chatbots con IA en tu entorno local o servidor.

## 📋 Requisitos Previos

### Opción 1: Con Docker (Recomendado)

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM mínimo
- 10GB espacio en disco

### Opción 2: Sin Docker

- Node.js 18+
- MySQL 8+
- Redis 7+
- 4GB RAM mínimo

## 🚀 Instalación con Docker (Recomendado)

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd saas-chatbot-ia
```

### 2. Configurar Variables de Entorno

#### Backend

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:

```env
# Base de Datos
DATABASE_URL="mysql://chatbot_user:chatbot_password@mysql:3306/chatbot_db"

# Redis
REDIS_URL="redis://redis:6379"

# JWT
JWT_SECRET="tu-secret-super-seguro-cambialo"
JWT_EXPIRATION="24h"

# Aplicación
PORT=3000
NODE_ENV="production"
CORS_ORIGINS="http://localhost,http://localhost:3002"

# Proveedores de IA (agregar tus API keys)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."
GOOGLE_AI_API_KEY="..."
MISTRAL_API_KEY="..."
COHERE_API_KEY="..."
LLAMA_API_KEY="..."

# WhatsApp QR Service
WHATSAPP_QR_SERVICE_URL="http://whatsapp-qr-service:3001"

# Pagos
FLOW_API_KEY="tu-flow-api-key"
FLOW_SECRET_KEY="tu-flow-secret-key"
FLOW_WEBHOOK_URL="https://tudominio.com/api/payments/flow/webhook"

PAYPAL_CLIENT_ID="tu-paypal-client-id"
PAYPAL_CLIENT_SECRET="tu-paypal-client-secret"
PAYPAL_MODE="sandbox"
PAYPAL_WEBHOOK_URL="https://tudominio.com/api/payments/paypal/webhook"

# Exchange Rates
EXCHANGE_RATE_API_KEY="tu-api-key"
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/USD"
```

#### Dashboard

```bash
cp dashboard/.env.example dashboard/.env
```

Editar `dashboard/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=ws://localhost/api
NEXT_PUBLIC_APP_URL=http://localhost
```

#### WhatsApp QR Service

```bash
cp whatsapp-qr-service/.env.example whatsapp-qr-service/.env
```

Editar `whatsapp-qr-service/.env`:

```env
PORT=3001
BACKEND_URL=http://api:3000
SESSIONS_DIR=./sessions
LOG_LEVEL=info
```

#### Widget

```bash
cp widget/.env.example widget/.env
```

Editar `widget/.env`:

```env
PUBLIC_API_URL=http://localhost/api
```

### 3. Iniciar Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
```

### 4. Ejecutar Migraciones de Base de Datos

```bash
# Esperar a que MySQL esté listo (30 segundos aprox)
sleep 30

# Ejecutar migraciones
docker-compose exec api npm run prisma:migrate:deploy

# (Opcional) Seed de datos iniciales
docker-compose exec api npm run prisma:seed
```

### 5. Verificar Instalación

Abrir en el navegador:

- **Dashboard**: http://localhost
- **API Docs**: http://localhost/api/docs
- **Health Check**: http://localhost/api/health

### 6. Crear Usuario Administrador

```bash
# Opción 1: Desde el dashboard
# Ir a http://localhost/register

# Opción 2: Desde la API
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "name": "Administrador"
  }'
```

## 🛠️ Instalación Sin Docker

### 1. Instalar Dependencias del Sistema

#### Ubuntu/Debian

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MySQL
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# Redis
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### macOS

```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js
brew install node@18

# MySQL
brew install mysql
brew services start mysql

# Redis
brew install redis
brew services start redis
```

### 2. Configurar Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE chatbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot_user'@'localhost' IDENTIFIED BY 'chatbot_password';
GRANT ALL PRIVILEGES ON chatbot_db.* TO 'chatbot_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Clonar y Configurar

```bash
# Clonar repositorio
git clone <repository-url>
cd saas-chatbot-ia

# Configurar variables de entorno (ver sección anterior)
cp backend/.env.example backend/.env
cp dashboard/.env.example dashboard/.env
cp whatsapp-qr-service/.env.example whatsapp-qr-service/.env
cp widget/.env.example widget/.env

# Editar archivos .env con tus configuraciones
```

### 4. Instalar Dependencias de Node.js

```bash
# Backend
cd backend
npm install
cd ..

# Dashboard
cd dashboard
npm install
cd ..

# WhatsApp QR Service
cd whatsapp-qr-service
npm install
cd ..

# Widget
cd widget
npm install
cd ..
```

### 5. Ejecutar Migraciones

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed  # Opcional
cd ..
```

### 6. Build de Producción

```bash
# Backend
cd backend
npm run build
cd ..

# Dashboard
cd dashboard
npm run build
cd ..

# WhatsApp QR Service
cd whatsapp-qr-service
npm run build
cd ..

# Widget
cd widget
npm run build
cd ..
```

### 7. Iniciar Servicios

#### Opción 1: Con PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar servicios
pm2 start backend/dist/main.js --name api
pm2 start whatsapp-qr-service/dist/index.js --name whatsapp-qr
pm2 start dashboard/node_modules/next/dist/bin/next --name dashboard -- start -p 3002

# Guardar configuración
pm2 save
pm2 startup
```

#### Opción 2: Manualmente

```bash
# Terminal 1 - Backend
cd backend
npm run start:prod

# Terminal 2 - WhatsApp QR Service
cd whatsapp-qr-service
npm start

# Terminal 3 - Dashboard
cd dashboard
npm start
```

### 8. Configurar Nginx (Opcional)

```bash
# Instalar Nginx
sudo apt-get install -y nginx  # Ubuntu/Debian
brew install nginx             # macOS

# Copiar configuración
sudo cp nginx/nginx.conf /etc/nginx/sites-available/chatbot
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/

# Reiniciar Nginx
sudo systemctl restart nginx  # Ubuntu/Debian
brew services restart nginx   # macOS
```

## 🔧 Configuración Adicional

### SSL/HTTPS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovación automática
sudo certbot renew --dry-run
```

### Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Backup Automático

```bash
# Crear script de backup
cat > /usr/local/bin/backup-chatbot.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/chatbot"

# Backup de base de datos
mysqldump -u chatbot_user -p'chatbot_password' chatbot_db > $BACKUP_DIR/db_$DATE.sql

# Backup de sesiones WhatsApp
tar -czf $BACKUP_DIR/sessions_$DATE.tar.gz whatsapp-qr-service/sessions/

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-chatbot.sh

# Agregar a crontab (diario a las 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-chatbot.sh") | crontab -
```

## 🧪 Verificación de Instalación

### 1. Health Checks

```bash
# API Backend
curl http://localhost:3000/health

# WhatsApp QR Service
curl http://localhost:3001/health

# Dashboard
curl http://localhost:3002
```

### 2. Verificar Servicios

```bash
# Con Docker
docker-compose ps

# Con PM2
pm2 status

# Manualmente
ps aux | grep node
```

### 3. Verificar Logs

```bash
# Con Docker
docker-compose logs -f api
docker-compose logs -f whatsapp-qr-service

# Con PM2
pm2 logs api
pm2 logs whatsapp-qr

# Archivos de log
tail -f backend/logs/combined.log
tail -f backend/logs/error.log
```

## 🐛 Solución de Problemas

### Error: Cannot connect to MySQL

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
# Verificar que la base de datos existe
mysql -u chatbot_user -p -e "SHOW DATABASES;"
```

### Error: Cannot connect to Redis

```bash
# Verificar que Redis esté corriendo
redis-cli ping  # Debe responder "PONG"

# Reiniciar Redis
sudo systemctl restart redis
```

### Error: Port already in use

```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

### Error: Prisma migrations failed

```bash
# Reset de base de datos (CUIDADO: elimina datos)
cd backend
npm run prisma:migrate:reset

# O manualmente
mysql -u chatbot_user -p chatbot_db < prisma/migrations/reset.sql
npm run prisma:migrate:deploy
```

### Logs no se generan

```bash
# Verificar permisos del directorio logs
chmod 755 backend/logs
chown -R $USER:$USER backend/logs
```

## 📊 Monitoreo

### Configurar Monitoreo con PM2

```bash
# Instalar PM2 Plus (opcional)
pm2 install pm2-logrotate

# Configurar rotación de logs
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Métricas con Docker

```bash
# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker-compose logs -f --tail=100
```

## 🔄 Actualización

```bash
# Con Docker
git pull
docker-compose down
docker-compose build
docker-compose up -d
docker-compose exec api npm run prisma:migrate:deploy

# Sin Docker
git pull
cd backend && npm install && npm run build && cd ..
cd dashboard && npm install && npm run build && cd ..
cd whatsapp-qr-service && npm install && npm run build && cd ..
pm2 restart all
```

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. Revisa los logs de cada servicio
2. Verifica que todas las variables de entorno estén configuradas
3. Consulta la sección de solución de problemas
4. Crea un issue en GitHub con detalles del error

## ✅ Checklist de Instalación

- [ ] Docker y Docker Compose instalados (o Node.js, MySQL, Redis)
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas en todos los servicios
- [ ] Servicios iniciados correctamente
- [ ] Migraciones de base de datos ejecutadas
- [ ] Health checks respondiendo OK
- [ ] Usuario administrador creado
- [ ] Dashboard accesible en navegador
- [ ] API Docs accesible
- [ ] Nginx configurado (si aplica)
- [ ] SSL configurado (si aplica)
- [ ] Backup automático configurado (si aplica)

¡Felicidades! Tu instalación está completa. Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para despliegue en producción.
