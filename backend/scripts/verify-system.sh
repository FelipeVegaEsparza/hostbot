#!/bin/bash

# System Verification Script (Shell version)
# Quick verification of base system components
# Requirements: 2.1, 8.2

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}  Sistema de Verificación de Configuración Base${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Archivo .env cargado${NC}"
else
    echo -e "${RED}✗ Archivo .env no encontrado${NC}"
    exit 1
fi

# Check Redis
echo -e "\n${BLUE}📦 Verificando Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli -u "${REDIS_URL:-redis://localhost:6379}" ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis está corriendo y accesible${NC}"
    else
        echo -e "${RED}✗ Redis no está accesible${NC}"
        echo -e "${YELLOW}  Intenta: redis-server${NC}"
    fi
else
    echo -e "${YELLOW}⚠ redis-cli no está instalado, no se puede verificar Redis${NC}"
fi

# Check MySQL
echo -e "\n${BLUE}🗄️  Verificando Base de Datos...${NC}"
if command -v mysql &> /dev/null; then
    # Parse DATABASE_URL
    if [[ $DATABASE_URL =~ mysql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME" &> /dev/null; then
            echo -e "${GREEN}✓ Base de datos accesible${NC}"
            
            # Check if tables exist
            TABLE_COUNT=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -D"$DB_NAME" -se "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME'" 2>/dev/null)
            
            if [ "$TABLE_COUNT" -gt 0 ]; then
                echo -e "${GREEN}✓ Schema inicializado ($TABLE_COUNT tablas)${NC}"
            else
                echo -e "${YELLOW}⚠ No se encontraron tablas. Ejecutar: npm run prisma:migrate${NC}"
            fi
        else
            echo -e "${RED}✗ No se pudo conectar a la base de datos${NC}"
        fi
    else
        echo -e "${RED}✗ Formato de DATABASE_URL inválido${NC}"
    fi
else
    echo -e "${YELLOW}⚠ mysql client no está instalado, no se puede verificar la base de datos${NC}"
fi

# Check WhatsApp QR Service
echo -e "\n${BLUE}📱 Verificando WhatsApp QR Service...${NC}"
if [ -n "$WHATSAPP_QR_SERVICE_URL" ]; then
    if curl -s -f "${WHATSAPP_QR_SERVICE_URL}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ WhatsApp QR Service está corriendo${NC}"
    else
        echo -e "${YELLOW}⚠ WhatsApp QR Service no está accesible (opcional)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ WHATSAPP_QR_SERVICE_URL no configurada (opcional)${NC}"
fi

# Check Environment Variables
echo -e "\n${BLUE}🔧 Verificando Variables de Entorno...${NC}"

check_var() {
    local var_name=$1
    local is_critical=$2
    
    if [ -z "${!var_name}" ]; then
        if [ "$is_critical" = "true" ]; then
            echo -e "${RED}✗ $var_name no configurada (crítica)${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ $var_name no configurada (opcional)${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✓ $var_name configurada${NC}"
        return 0
    fi
}

ERRORS=0

check_var "DATABASE_URL" "true" || ((ERRORS++))
check_var "REDIS_URL" "true" || ((ERRORS++))
check_var "JWT_SECRET" "true" || ((ERRORS++))
check_var "ALLOWED_ORIGINS" "true" || ((ERRORS++))
check_var "API_PORT" "false"
check_var "OPENAI_API_KEY" "false"
check_var "WHATSAPP_QR_SERVICE_URL" "false"

# Summary
echo -e "\n${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}${BOLD}  Resumen${NC}"
echo -e "${BLUE}${BOLD}═══════════════════════════════════════════════════════${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}${BOLD}❌ Sistema NO está listo para operar${NC}"
    echo -e "${RED}Se encontraron $ERRORS error(es) crítico(s)${NC}"
    exit 1
else
    echo -e "${GREEN}${BOLD}✅ Sistema configurado correctamente${NC}"
    exit 0
fi
