#!/bin/bash

# Script de ayuda para despliegue en Dokploy
# Autor: Sistema de Chatbots IA
# Uso: ./deploy-dokploy.sh

set -e

echo "🚀 Preparando proyecto para Dokploy..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar que estamos en la raíz del proyecto
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

print_success "Proyecto detectado correctamente"

# Verificar archivos necesarios
echo ""
echo "📋 Verificando archivos necesarios..."

files_to_check=(
    "backend/Dockerfile"
    "backend/.env.example"
    "whatsapp-qr-service/Dockerfile"
    "whatsapp-qr-service/.env.example"
    "dashboard/Dockerfile"
    "dashboard/.env.example"
    "widget/Dockerfile"
    "dokploy.json"
    "DOKPLOY_DEPLOYMENT.md"
)

missing_files=0
for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file"
    else
        print_error "$file - FALTA"
        missing_files=$((missing_files + 1))
    fi
done

if [ $missing_files -gt 0 ]; then
    print_error "Faltan $missing_files archivos necesarios"
    exit 1
fi

# Verificar Git
echo ""
echo "🔍 Verificando Git..."

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Este no es un repositorio Git"
    echo "Inicializa Git con: git init"
    exit 1
fi

print_success "Repositorio Git detectado"

# Verificar remote
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No hay remote 'origin' configurado"
    echo "Configura tu repositorio de GitHub:"
    echo "  git remote add origin https://github.com/tu-usuario/tu-repo.git"
else
    REMOTE_URL=$(git remote get-url origin)
    print_success "Remote configurado: $REMOTE_URL"
fi

# Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
print_success "Branch actual: $CURRENT_BRANCH"

# Verificar cambios sin commit
if ! git diff-index --quiet HEAD --; then
    print_warning "Hay cambios sin commit"
    echo ""
    echo "¿Deseas hacer commit de los cambios? (s/n)"
    read -r response
    if [ "$response" = "s" ] || [ "$response" = "S" ]; then
        echo "Mensaje del commit:"
        read -r commit_message
        git add .
        git commit -m "$commit_message"
        print_success "Cambios commiteados"
    fi
fi

# Preguntar si hacer push
echo ""
echo "¿Deseas hacer push a GitHub ahora? (s/n)"
read -r push_response
if [ "$push_response" = "s" ] || [ "$push_response" = "S" ]; then
    git push origin "$CURRENT_BRANCH"
    print_success "Push completado"
fi

# Generar resumen de configuración
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE CONFIGURACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Servicios a desplegar:"
echo "  • MySQL 8.0 (Base de datos)"
echo "  • Redis 7 (Caché y colas)"
echo "  • Backend API (NestJS) - Puerto 3000"
echo "  • WhatsApp QR Service - Puerto 3002"
echo "  • Dashboard (Next.js) - Puerto 3001"
echo "  • Widget (Astro) - Puerto 4321"
echo ""
echo "Recursos totales estimados:"
echo "  • RAM: ~2.5 GB"
echo "  • CPU: ~2.5 cores"
echo "  • Disco: ~20 GB"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generar checklist
echo ""
echo "📝 CHECKLIST PARA DOKPLOY"
echo ""
echo "Antes de desplegar en Dokploy, asegúrate de tener:"
echo ""
echo "  [ ] Servidor VPS con Dokploy instalado"
echo "  [ ] Dominio(s) apuntando al servidor"
echo "  [ ] API Keys de proveedores de IA:"
echo "      [ ] OpenAI API Key"
echo "      [ ] Anthropic API Key (opcional)"
echo "      [ ] Groq API Key (opcional)"
echo "      [ ] Google AI API Key (opcional)"
echo "  [ ] Credenciales de pago (opcional):"
echo "      [ ] Flow API Key (para CLP)"
echo "      [ ] PayPal Client ID (para USD)"
echo "  [ ] WhatsApp configurado (opcional):"
echo "      [ ] WhatsApp Cloud API credentials"
echo ""

# Generar archivo de variables de entorno de ejemplo
echo ""
echo "¿Deseas generar un archivo con las variables de entorno necesarias? (s/n)"
read -r env_response
if [ "$env_response" = "s" ] || [ "$env_response" = "S" ]; then
    cat > DOKPLOY_ENV_TEMPLATE.txt << 'EOF'
# ============================================
# VARIABLES DE ENTORNO PARA DOKPLOY
# ============================================
# Copia estas variables en cada servicio en Dokploy

# ============================================
# BACKEND API
# ============================================

# Base de Datos (Dokploy te dará esta URL)
DATABASE_URL=mysql://chatbot_user:PASSWORD@chatbot-mysql:3306/chatbot_saas

# Redis (Dokploy te dará esta URL)
REDIS_URL=redis://chatbot-redis:6379

# JWT (Genera un secret seguro)
JWT_SECRET=GENERA_UN_SECRET_MUY_SEGURO_AQUI_MIN_32_CARACTERES
JWT_EXPIRATION=24h

# Aplicación
PORT=3000
NODE_ENV=production
API_URL=https://api.tudominio.com

# CORS (ajusta según tus dominios)
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com,https://dashboard.tudominio.com

# OpenAI (REQUERIDO)
OPENAI_API_KEY=sk-tu-api-key-aqui

# Anthropic (OPCIONAL)
ANTHROPIC_API_KEY=sk-ant-tu-api-key-aqui

# Google AI (OPCIONAL)
GOOGLE_AI_API_KEY=tu-api-key-aqui

# Groq (OPCIONAL)
GROQ_API_KEY=gsk_tu-api-key-aqui

# Mistral (OPCIONAL)
MISTRAL_API_KEY=tu-api-key-aqui

# Cohere (OPCIONAL)
COHERE_API_KEY=tu-api-key-aqui

# WhatsApp Cloud API (OPCIONAL)
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_APP_SECRET=tu-app-secret
WHATSAPP_VERIFY_TOKEN=tu-verify-token

# WhatsApp QR Service
WHATSAPP_QR_SERVICE_URL=http://whatsapp-qr:3002

# Pagos - Flow (OPCIONAL)
FLOW_API_KEY=tu-flow-api-key
FLOW_SECRET_KEY=tu-flow-secret-key
FLOW_API_URL=https://www.flow.cl/api
FLOW_WEBHOOK_URL=https://api.tudominio.com/api/payments/flow/webhook

# Pagos - PayPal (OPCIONAL)
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_SECRET=tu-paypal-client-secret
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_URL=https://api.tudominio.com/api/payments/paypal/webhook

# Exchange Rates (OPCIONAL)
EXCHANGE_RATE_API_KEY=tu-exchange-rate-api-key

# ============================================
# WHATSAPP QR SERVICE
# ============================================

PORT=3002
NODE_ENV=production
BACKEND_API_URL=http://backend-api:3000
SESSIONS_DIR=/app/sessions
LOG_LEVEL=info

# ============================================
# DASHBOARD
# ============================================

NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
NEXT_PUBLIC_APP_URL=https://dashboard.tudominio.com
NODE_ENV=production

# ============================================
# WIDGET
# ============================================

PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production

EOF
    print_success "Archivo DOKPLOY_ENV_TEMPLATE.txt creado"
    echo "Revisa este archivo para ver todas las variables necesarias"
fi

# Instrucciones finales
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PRÓXIMOS PASOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abre tu panel de Dokploy:"
echo "   https://tu-servidor.com:3000"
echo ""
echo "2. Crea un nuevo proyecto llamado 'chatbot-saas'"
echo ""
echo "3. Conecta tu repositorio de GitHub"
echo ""
echo "4. Sigue la guía completa en:"
echo "   DOKPLOY_DEPLOYMENT.md"
echo ""
echo "5. Configura las variables de entorno usando:"
echo "   DOKPLOY_ENV_TEMPLATE.txt"
echo ""
print_success "¡Todo listo para desplegar en Dokploy!"
echo ""
