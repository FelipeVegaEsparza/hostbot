# Guía de Despliegue en Producción

Esta guía cubre el despliegue del SaaS de Chatbots con IA en diferentes entornos de producción.

## 📋 Requisitos Previos

- Servidor con Ubuntu 20.04+ o similar
- Dominio configurado con DNS
- Certificado SSL (Let's Encrypt recomendado)
- Mínimo 4GB RAM, 2 CPU cores, 20GB disco
- Docker y Docker Compose instalados

## 🏗️ Arquitectura de Producción

```mermaid
graph TB
    INTERNET[Internet]
    LB[Load Balancer / CDN]
    NGINX[Nginx Reverse Proxy]
    
    subgraph "Application Servers"
        API1[API Instance 1]
        API2[API Instance 2]
        WAQR[WhatsApp QR Service]
        DASH[Dashboard]
    end
    
    subgraph "Data Layer"
        MYSQL[(MySQL Primary)]
        MYSQL_REPLICA[(MySQL Replica)]
        REDIS[(Redis Cluster)]
    end
    
    subgraph "Storage"
        S3[S3 / Object Storage]
    end
    
    INTERNET --> LB
    LB --> NGINX
    NGINX --> API1
    NGINX --> API2
    NGINX --> WAQR
    NGINX --> DASH
    
    API1 --> MYSQL
    API2 --> MYSQL
    API1 --> REDIS
    API2 --> REDIS
    WAQR --> REDIS
    
    MYSQL --> MYSQL_REPLICA
    WAQR --> S3
```

## 🚀 Despliegue con Docker en VPS

### 1. Preparar Servidor

```bash
# Conectar al servidor
ssh root@tu-servidor.com

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Crear usuario para la aplicación
useradd -m -s /bin/bash chatbot
usermod -aG docker chatbot
```

### 2. Configurar Firewall

```bash
# UFW
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable

# Verificar
ufw status
```

### 3. Clonar Repositorio

```bash
# Cambiar a usuario chatbot
su - chatbot

# Clonar código
git clone <repository-url> /home/chatbot/app
cd /home/chatbot/app
```

### 4. Configurar Variables de Entorno

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

**Configuración de producción:**

```env
# Base de Datos
DATABASE_URL="mysql://chatbot_user:STRONG_PASSWORD@mysql:3306/chatbot_db"

# Redis
REDIS_URL="redis://:REDIS_PASSWORD@redis:6379"

# JWT
JWT_SECRET="GENERATE_STRONG_SECRET_HERE"
JWT_EXPIRATION="24h"

# Aplicación
PORT=3000
NODE_ENV="production"
CORS_ORIGINS="https://tudominio.com,https://www.tudominio.com"

# API Keys de IA (tus keys reales)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
# ... resto de keys

# URLs públicas
WHATSAPP_QR_SERVICE_URL="http://whatsapp-qr-service:3001"

# Pagos (producción)
FLOW_API_KEY="tu-flow-api-key-produccion"
FLOW_SECRET_KEY="tu-flow-secret-key-produccion"
FLOW_WEBHOOK_URL="https://tudominio.com/api/payments/flow/webhook"

PAYPAL_CLIENT_ID="tu-paypal-client-id-produccion"
PAYPAL_CLIENT_SECRET="tu-paypal-client-secret-produccion"
PAYPAL_MODE="live"
PAYPAL_WEBHOOK_URL="https://tudominio.com/api/payments/paypal/webhook"

# Exchange Rates
EXCHANGE_RATE_API_KEY="tu-api-key"
```

```bash
# Dashboard
cp dashboard/.env.example dashboard/.env
nano dashboard/.env
```

```env
NEXT_PUBLIC_API_URL=https://tudominio.com/api
NEXT_PUBLIC_WS_URL=wss://tudominio.com/api
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

```bash
# WhatsApp QR Service
cp whatsapp-qr-service/.env.example whatsapp-qr-service/.env
nano whatsapp-qr-service/.env
```

```env
PORT=3001
BACKEND_URL=http://api:3000
SESSIONS_DIR=./sessions
LOG_LEVEL=warn
```

### 5. Configurar Docker Compose para Producción

Editar `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: chatbot_db
      MYSQL_USER: chatbot_user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  whatsapp-qr-service:
    build:
      context: ./whatsapp-qr-service
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - api
    env_file:
      - ./whatsapp-qr-service/.env
    volumes:
      - whatsapp_sessions:/app/sessions

  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - api
    env_file:
      - ./dashboard/.env

  widget:
    build:
      context: ./widget
      dockerfile: Dockerfile
    restart: always

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot:ro
    depends_on:
      - api
      - dashboard
      - widget

  certbot:
    image: certbot/certbot
    volumes:
      - certbot_data:/var/www/certbot
      - ./nginx/ssl:/etc/letsencrypt

volumes:
  mysql_data:
  redis_data:
  whatsapp_sessions:
  certbot_data:
```

### 6. Configurar Nginx con SSL

```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Configurar Nginx
nano nginx/nginx.conf
```

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    upstream dashboard {
        server dashboard:3000;
    }

    upstream widget {
        server widget:4321;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name tudominio.com www.tudominio.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name tudominio.com www.tudominio.com;

        ssl_certificate /etc/nginx/ssl/live/tudominio.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/tudominio.com/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Widget
        location /widget {
            limit_req zone=general_limit burst=50 nodelay;
            proxy_pass http://widget;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            
            # CORS for widget
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type" always;
        }

        # Dashboard
        location / {
            limit_req zone=general_limit burst=50 nodelay;
            proxy_pass http://dashboard;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    }
}
```

### 7. Obtener Certificado SSL

```bash
# Iniciar Nginx temporalmente
docker-compose up -d nginx

# Obtener certificado
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d tudominio.com \
  -d www.tudominio.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email

# Reiniciar Nginx
docker-compose restart nginx
```

### 8. Iniciar Aplicación

```bash
# Build e iniciar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 9. Ejecutar Migraciones

```bash
# Esperar a que MySQL esté listo
sleep 30

# Ejecutar migraciones
docker-compose exec api npm run prisma:migrate:deploy

# Seed de datos iniciales (opcional)
docker-compose exec api npm run prisma:seed
```

### 10. Configurar Renovación Automática de SSL

```bash
# Crear script de renovación
cat > /home/chatbot/renew-ssl.sh << 'EOF'
#!/bin/bash
cd /home/chatbot/app
docker-compose run --rm certbot renew
docker-compose restart nginx
EOF

chmod +x /home/chatbot/renew-ssl.sh

# Agregar a crontab (verificar diariamente)
(crontab -l 2>/dev/null; echo "0 3 * * * /home/chatbot/renew-ssl.sh >> /home/chatbot/ssl-renew.log 2>&1") | crontab -
```

## ☁️ Despliegue en AWS

### Arquitectura AWS

- **EC2**: Instancias para API y servicios
- **RDS**: MySQL gestionado
- **ElastiCache**: Redis gestionado
- **S3**: Almacenamiento de sesiones WhatsApp
- **CloudFront**: CDN para widget
- **ALB**: Load Balancer
- **Route 53**: DNS

### 1. Crear Infraestructura

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciales
aws configure
```

### 2. Crear RDS MySQL

```bash
aws rds create-db-instance \
  --db-instance-identifier chatbot-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### 3. Crear ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id chatbot-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx
```

### 4. Crear S3 Bucket

```bash
aws s3 mb s3://chatbot-whatsapp-sessions
aws s3api put-bucket-versioning \
  --bucket chatbot-whatsapp-sessions \
  --versioning-configuration Status=Enabled
```

### 5. Desplegar en EC2

```bash
# Crear instancia EC2
aws ec2 run-instances \
  --image-id ami-xxxxx \
  --instance-type t3.medium \
  --key-name your-key \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=chatbot-api}]'

# Conectar y configurar (ver sección VPS)
```

## 🐳 Despliegue en Kubernetes

### 1. Crear Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: chatbot
```

### 2. Configurar Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: chatbot-secrets
  namespace: chatbot
type: Opaque
stringData:
  DATABASE_URL: "mysql://user:pass@mysql:3306/chatbot_db"
  REDIS_URL: "redis://redis:6379"
  JWT_SECRET: "your-secret"
  OPENAI_API_KEY: "sk-..."
```

### 3. Deployments

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: chatbot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: your-registry/chatbot-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: chatbot-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 4. Services

```yaml
# api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: chatbot
spec:
  selector:
    app: api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### 5. Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chatbot-ingress
  namespace: chatbot
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - tudominio.com
    secretName: chatbot-tls
  rules:
  - host: tudominio.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dashboard
            port:
              number: 3000
```

## 📊 Monitoreo y Logging

### Configurar Prometheus

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'chatbot-api'
    static_configs:
      - targets: ['api:3000']
```

### Configurar Grafana

```bash
# Instalar Grafana
docker run -d \
  --name=grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana
```

### Logging con ELK Stack

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## 🔄 CI/CD con GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker-compose build
      
      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker-compose push
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/chatbot/app
            git pull
            docker-compose pull
            docker-compose up -d
            docker-compose exec -T api npm run prisma:migrate:deploy
```

## 🔒 Seguridad en Producción

### 1. Configurar Fail2Ban

```bash
# Instalar Fail2Ban
apt install fail2ban

# Configurar
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
EOF

systemctl restart fail2ban
```

### 2. Configurar Firewall Avanzado

```bash
# Denegar todo por defecto
ufw default deny incoming
ufw default allow outgoing

# Permitir solo lo necesario
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Habilitar
ufw enable
```

### 3. Secrets Management

```bash
# Usar Docker Secrets
echo "my-secret-password" | docker secret create mysql_password -

# Usar en docker-compose.yml
services:
  mysql:
    secrets:
      - mysql_password
    environment:
      MYSQL_PASSWORD_FILE: /run/secrets/mysql_password

secrets:
  mysql_password:
    external: true
```

## 📈 Escalado

### Escalado Horizontal

```bash
# Escalar API
docker-compose up -d --scale api=3

# Con Kubernetes
kubectl scale deployment api --replicas=5 -n chatbot
```

### Escalado Vertical

```yaml
# Aumentar recursos en docker-compose.yml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## 🔄 Backup y Recuperación

### Script de Backup Completo

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/chatbot/$DATE"
mkdir -p $BACKUP_DIR

# Backup MySQL
docker-compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD chatbot_db > $BACKUP_DIR/database.sql

# Backup Redis
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/redis.rdb

# Backup sesiones WhatsApp
docker cp $(docker-compose ps -q whatsapp-qr-service):/app/sessions $BACKUP_DIR/sessions

# Backup configuración
cp -r backend/.env dashboard/.env nginx/ $BACKUP_DIR/

# Comprimir
tar -czf /backups/chatbot_$DATE.tar.gz -C /backups/chatbot $DATE

# Subir a S3
aws s3 cp /backups/chatbot_$DATE.tar.gz s3://my-backups/chatbot/

# Limpiar backups antiguos
find /backups -name "chatbot_*.tar.gz" -mtime +30 -delete
```

## ✅ Checklist de Despliegue

- [ ] Servidor configurado con Docker
- [ ] Firewall configurado
- [ ] DNS apuntando al servidor
- [ ] SSL configurado con Let's Encrypt
- [ ] Variables de entorno configuradas
- [ ] Servicios iniciados correctamente
- [ ] Migraciones ejecutadas
- [ ] Health checks respondiendo
- [ ] Monitoreo configurado
- [ ] Backups automáticos configurados
- [ ] CI/CD configurado
- [ ] Documentación actualizada
- [ ] Pruebas de carga realizadas
- [ ] Plan de rollback definido

## 📞 Soporte

Para problemas de despliegue, consultar:
- Logs de servicios
- Documentación de Docker
- Issues en GitHub

¡Tu aplicación está lista para producción!
