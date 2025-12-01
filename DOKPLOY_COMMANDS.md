# 🛠️ Comandos Útiles para Dokploy

Referencia rápida de comandos para gestionar tu aplicación en Dokploy.

## 📦 Comandos de Despliegue

### Preparar para despliegue
```bash
# Hacer el script ejecutable
chmod +x deploy-dokploy.sh

# Ejecutar script de preparación
./deploy-dokploy.sh
```

### Push a GitHub (trigger auto-deploy)
```bash
git add .
git commit -m "Deploy to Dokploy"
git push origin main
```

## 🗄️ Comandos de Base de Datos

### Ejecutar migraciones (desde consola de backend en Dokploy)
```bash
npm run prisma:migrate:deploy
```

### Generar cliente Prisma
```bash
npm run prisma:generate
```

### Seed de datos iniciales
```bash
npm run prisma:seed
```

### Abrir Prisma Studio (para ver/editar datos)
```bash
npm run prisma:studio
```

### Backup manual de MySQL
```bash
# Desde tu servidor Dokploy
docker exec chatbot-mysql mysqldump -u chatbot_user -p chatbot_saas > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
docker exec -i chatbot-mysql mysql -u chatbot_user -p chatbot_saas < backup_20240101.sql
```

## 🔍 Comandos de Diagnóstico

### Ver logs en tiempo real (en Dokploy UI)
```
1. Ve al servicio
2. Click en "Logs"
3. Activa "Follow logs"
```

### Ver estado de salud del backend
```bash
curl https://api.tudominio.com/health
```

### Ver estado de Redis
```bash
# Desde consola de Redis en Dokploy
redis-cli ping
redis-cli info
```

### Ver colas de BullMQ
```bash
# Desde consola de backend
npm run verify:system
```

### Verificar conexiones WebSocket
```bash
curl https://api.tudominio.com/health/websocket
```

## 🔧 Comandos de Mantenimiento

### Reiniciar un servicio
```
En Dokploy UI:
1. Ve al servicio
2. Click en "Restart"
```

### Rebuild un servicio
```
En Dokploy UI:
1. Ve al servicio
2. Click en "Rebuild"
```

### Escalar un servicio (aumentar réplicas)
```
En Dokploy UI:
1. Ve al servicio
2. Settings → Replicas
3. Aumenta el número
```

### Limpiar caché de Redis
```bash
# Desde consola de Redis
redis-cli FLUSHALL
```

### Limpiar trabajos fallidos de colas
```bash
# Desde consola de backend
node -e "
const { Queue } = require('bullmq');
const queue = new Queue('incoming-messages', { connection: { host: 'chatbot-redis', port: 6379 }});
queue.clean(0, 1000, 'failed');
"
```

## 📊 Comandos de Monitoreo

### Ver uso de recursos
```bash
# CPU y RAM de todos los contenedores
docker stats

# Solo un servicio específico
docker stats chatbot-backend
```

### Ver espacio en disco
```bash
df -h
```

### Ver logs de sistema
```bash
# Últimas 100 líneas
docker logs --tail 100 chatbot-backend

# Seguir logs en tiempo real
docker logs -f chatbot-backend
```

### Ver procesos de Node.js
```bash
# Desde consola de backend
ps aux | grep node
```

## 🔐 Comandos de Seguridad

### Rotar JWT Secret
```bash
# 1. Genera nuevo secret
openssl rand -base64 32

# 2. Actualiza en Dokploy:
#    Backend → Environment Variables → JWT_SECRET

# 3. Reinicia el backend
```

### Ver intentos de login fallidos
```bash
# Desde consola de backend
npm run prisma:studio
# Luego busca en la tabla de logs
```

### Verificar certificados SSL
```bash
curl -vI https://api.tudominio.com 2>&1 | grep -i "SSL\|TLS"
```

## 🚀 Comandos de Optimización

### Limpiar imágenes Docker antiguas
```bash
docker image prune -a
```

### Limpiar volúmenes no usados
```bash
docker volume prune
```

### Ver tamaño de volúmenes
```bash
docker system df -v
```

### Optimizar base de datos
```bash
# Desde consola de MySQL
mysqlcheck -u chatbot_user -p --optimize --all-databases
```

## 🧪 Comandos de Testing

### Ejecutar tests (localmente antes de deploy)
```bash
# Backend
cd backend
npm test

# E2E tests
npm run test:e2e
```

### Test de carga (con Artillery)
```bash
# Instalar Artillery
npm install -g artillery

# Crear archivo de test
cat > load-test.yml << EOF
config:
  target: "https://api.tudominio.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/health"
EOF

# Ejecutar test
artillery run load-test.yml
```

### Test de endpoints
```bash
# Health check
curl https://api.tudominio.com/health

# Login
curl -X POST https://api.tudominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Crear chatbot
curl -X POST https://api.tudominio.com/api/chatbots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Bot","aiProvider":"OPENAI","aiModel":"gpt-3.5-turbo"}'
```

## 🔄 Comandos de Rollback

### Ver historial de deploys
```
En Dokploy UI:
1. Ve al servicio
2. Click en "Deployments"
3. Ver historial
```

### Rollback a versión anterior
```
En Dokploy UI:
1. Ve al servicio
2. Deployments → Selecciona versión anterior
3. Click en "Rollback"
```

### Rollback manual con Git
```bash
# Ver commits recientes
git log --oneline -10

# Revertir a commit específico
git revert <commit-hash>
git push origin main
```

## 📱 Comandos de WhatsApp

### Ver sesiones activas
```bash
# Desde consola de whatsapp-qr
ls -la /app/sessions
```

### Limpiar sesión específica
```bash
# Desde consola de whatsapp-qr
rm -rf /app/sessions/session_CHATBOT_ID_*
```

### Ver logs de WhatsApp
```bash
# En Dokploy UI
WhatsApp QR Service → Logs
```

## 🎨 Comandos de Widget

### Rebuild widget con nuevos estilos
```bash
# Localmente
cd widget
npm run build

# Luego push a GitHub para auto-deploy
git add .
git commit -m "Update widget styles"
git push
```

### Test del widget localmente
```bash
cd widget
npm run dev
# Abre http://localhost:4321
```

## 📧 Comandos de Notificaciones

### Configurar webhook de Slack
```
En Dokploy UI:
1. Project Settings
2. Notifications
3. Add Slack Webhook
4. Pega tu webhook URL
```

### Test de notificación
```bash
curl -X POST YOUR_SLACK_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"text":"Test desde Dokploy"}'
```

## 🔍 Comandos de Debug

### Entrar a shell de un contenedor
```
En Dokploy UI:
1. Ve al servicio
2. Click en "Console"
3. Ejecuta comandos
```

### Ver variables de entorno
```bash
# Desde consola del servicio
env | sort
```

### Ver configuración de Node.js
```bash
node -v
npm -v
node -p "process.env"
```

### Debug de conexión a MySQL
```bash
# Desde consola de backend
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection(process.env.DATABASE_URL)
  .then(() => console.log('✓ MySQL conectado'))
  .catch(err => console.error('✗ Error:', err.message));
"
```

### Debug de conexión a Redis
```bash
# Desde consola de backend
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping()
  .then(() => console.log('✓ Redis conectado'))
  .catch(err => console.error('✗ Error:', err.message));
"
```

## 💾 Comandos de Backup

### Backup completo automático
```bash
#!/bin/bash
# Crear script de backup
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MySQL
docker exec chatbot-mysql mysqldump -u chatbot_user -p chatbot_saas > backup_mysql_$DATE.sql

# Backup Redis
docker exec chatbot-redis redis-cli --rdb /data/dump.rdb
docker cp chatbot-redis:/data/dump.rdb backup_redis_$DATE.rdb

# Backup sesiones WhatsApp
docker cp chatbot-whatsapp:/app/sessions backup_sessions_$DATE

# Comprimir todo
tar -czf backup_complete_$DATE.tar.gz backup_*_$DATE.*

# Subir a S3 (opcional)
# aws s3 cp backup_complete_$DATE.tar.gz s3://my-backups/
```

### Programar backups automáticos
```bash
# Agregar a crontab
crontab -e

# Backup diario a las 3 AM
0 3 * * * /path/to/backup-script.sh
```

## 🌐 Comandos de DNS

### Verificar DNS
```bash
# Verificar registro A
dig api.tudominio.com +short

# Verificar propagación DNS
nslookup api.tudominio.com 8.8.8.8
```

### Verificar SSL
```bash
# Ver certificado
openssl s_client -connect api.tudominio.com:443 -servername api.tudominio.com

# Ver fecha de expiración
echo | openssl s_client -connect api.tudominio.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 📈 Comandos de Performance

### Ver queries lentas de MySQL
```bash
# Desde consola de MySQL
SHOW FULL PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';
```

### Ver uso de Redis
```bash
# Desde consola de Redis
redis-cli INFO memory
redis-cli INFO stats
```

### Analizar bundle size del frontend
```bash
# Dashboard
cd dashboard
npm run build
npm run analyze

# Widget
cd widget
npm run build
```

## 🎯 Comandos Rápidos

### Status general
```bash
curl https://api.tudominio.com/health && echo "✓ API OK"
curl https://dashboard.tudominio.com && echo "✓ Dashboard OK"
curl https://widget.tudominio.com && echo "✓ Widget OK"
```

### Reinicio completo
```
En Dokploy UI:
Project → Actions → Restart All Services
```

### Ver logs de todos los servicios
```bash
docker-compose logs -f --tail=100
```

---

## 📚 Recursos Adicionales

- **Documentación Dokploy**: https://docs.dokploy.com
- **Guía de despliegue**: Ver `DOKPLOY_DEPLOYMENT.md`
- **Variables de entorno**: Ver `DOKPLOY_ENV_TEMPLATE.txt`

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs en Dokploy UI
2. Verifica las variables de entorno
3. Consulta `TROUBLESHOOTING_GUIDE.md` en backend/docs
4. Revisa los issues en GitHub

---

**Tip**: Guarda este archivo como referencia rápida. Muchos de estos comandos los usarás frecuentemente.
