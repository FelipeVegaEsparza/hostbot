# 🚀 Despliegue en Dokploy - Guía Rápida

## 📦 Archivos Creados para Dokploy

He creado todos los archivos necesarios para desplegar tu proyecto en Dokploy:

### 📄 Archivos Principales

1. **`DOKPLOY_DEPLOYMENT.md`** ⭐ EMPIEZA AQUÍ
   - Guía completa paso a paso
   - Instrucciones detalladas para cada servicio
   - Configuración de dominios y SSL
   - Troubleshooting

2. **`dokploy.json`**
   - Configuración de servicios
   - Recursos y límites
   - Dependencias entre servicios

3. **`DOKPLOY_CHECKLIST.md`**
   - Checklist completo de despliegue
   - Verificación post-despliegue
   - Lista de tareas

4. **`DOKPLOY_COMMANDS.md`**
   - Comandos útiles para gestión
   - Comandos de diagnóstico
   - Comandos de mantenimiento

5. **`deploy-dokploy.sh`**
   - Script de preparación automática
   - Verificación de archivos
   - Generación de templates

## 🎯 Inicio Rápido (3 pasos)

### 1️⃣ Preparar Localmente

```bash
# En Windows (PowerShell)
.\deploy-dokploy.sh

# En Linux/Mac
chmod +x deploy-dokploy.sh
./deploy-dokploy.sh
```

Este script:
- ✅ Verifica que todo esté listo
- ✅ Genera template de variables de entorno
- ✅ Te guía en el proceso

### 2️⃣ Push a GitHub

```bash
git add .
git commit -m "Ready for Dokploy deployment"
git push origin main
```

### 3️⃣ Desplegar en Dokploy

1. Abre tu panel de Dokploy: `https://tu-servidor.com:3000`
2. Crea un nuevo proyecto: `chatbot-saas`
3. Conecta tu repositorio de GitHub
4. Sigue la guía: `DOKPLOY_DEPLOYMENT.md`

## 📋 Servicios que se Desplegarán

| Servicio | Puerto | Recursos | Descripción |
|----------|--------|----------|-------------|
| MySQL | 3306 | 10GB | Base de datos |
| Redis | 6379 | 2GB | Caché y colas |
| Backend API | 3000 | 1GB RAM, 1 CPU | API principal |
| WhatsApp QR | 3002 | 512MB RAM | Servicio WhatsApp |
| Dashboard | 3001 | 512MB RAM | Panel admin |
| Widget | 4321 | 256MB RAM | Widget embebible |

**Total estimado**: ~2.5GB RAM, ~2.5 CPU cores, ~20GB disco

## 🌐 Dominios Necesarios

Necesitarás configurar estos subdominios (o puedes usar uno solo):

- `api.tudominio.com` → Backend API
- `dashboard.tudominio.com` → Panel de administración
- `widget.tudominio.com` → Widget embebible

**Alternativa**: Puedes usar un solo dominio con paths:
- `tudominio.com/api` → Backend
- `tudominio.com` → Dashboard
- `tudominio.com/widget` → Widget

## 🔑 Variables de Entorno Necesarias

### Mínimas (para empezar)

```env
# Backend
DATABASE_URL=mysql://...  # Dokploy te lo da
REDIS_URL=redis://...     # Dokploy te lo da
JWT_SECRET=tu-secret-muy-seguro-aqui
OPENAI_API_KEY=sk-...     # Tu API key de OpenAI
```

### Completas

Ejecuta el script `deploy-dokploy.sh` para generar el archivo `DOKPLOY_ENV_TEMPLATE.txt` con todas las variables necesarias.

## ⏱️ Tiempo Estimado de Despliegue

- **Preparación**: 15-30 minutos
- **Configuración en Dokploy**: 30-45 minutos
- **Primer despliegue (builds)**: 15-20 minutos
- **Verificación y pruebas**: 15-30 minutos

**Total**: 1.5 - 2 horas aproximadamente

## 💰 Costos Estimados

### Servidor VPS (requerido)
- **Mínimo**: $6-12/mes (DigitalOcean, Vultr, Contabo)
- **Recomendado**: $12-24/mes (4GB RAM, 2 CPU)

### Dominio
- **Costo**: $10-15/año

### API Keys de IA (según uso)
- **OpenAI**: Pay-as-you-go (desde $0)
- **Otras**: Opcional

**Total mensual estimado**: $6-25/mes + uso de IA

## ✅ Requisitos Previos

Antes de empezar, asegúrate de tener:

- [ ] Servidor VPS con Dokploy instalado
- [ ] Repositorio en GitHub (público o privado)
- [ ] Dominio (opcional pero recomendado)
- [ ] OpenAI API Key (mínimo)
- [ ] 2 horas de tiempo disponible

## 📚 Orden de Lectura de Documentos

1. **Este archivo** (README_DOKPLOY.md) - Visión general
2. **DOKPLOY_DEPLOYMENT.md** - Guía paso a paso completa
3. **DOKPLOY_CHECKLIST.md** - Mientras despliegas
4. **DOKPLOY_COMMANDS.md** - Después del despliegue (referencia)

## 🆘 Soporte y Troubleshooting

### Si algo no funciona:

1. **Revisa el checklist**: `DOKPLOY_CHECKLIST.md`
2. **Consulta comandos útiles**: `DOKPLOY_COMMANDS.md`
3. **Revisa logs en Dokploy**: Cada servicio tiene su pestaña de logs
4. **Consulta troubleshooting**: `backend/docs/TROUBLESHOOTING_GUIDE.md`

### Problemas Comunes

#### Backend no inicia
```bash
# Verifica variables de entorno
# Revisa logs en Dokploy UI
# Verifica que MySQL y Redis estén corriendo
```

#### Migraciones fallan
```bash
# Desde consola de backend en Dokploy
npm run prisma:generate
npm run prisma:migrate:deploy --force
```

#### SSL no se genera
```bash
# Verifica que el dominio apunte al servidor
# Espera 5-10 minutos después de configurar DNS
# Intenta regenerar el certificado en Dokploy
```

#### Widget no carga
```bash
# Verifica CORS en backend
# Verifica PUBLIC_API_URL en widget
# Revisa logs del widget
```

## 🎉 Después del Despliegue

Una vez desplegado exitosamente:

1. **Crea tu primer usuario admin**
2. **Configura tu primer chatbot**
3. **Prueba el widget en una página**
4. **Conecta WhatsApp** (opcional)
5. **Configura pagos** (opcional)

## 🔄 Actualizaciones Futuras

Después del despliegue inicial, actualizar es muy fácil:

```bash
# Haz tus cambios localmente
git add .
git commit -m "Nueva feature"
git push origin main

# Dokploy desplegará automáticamente 🎉
```

## 📊 Monitoreo

Dokploy incluye:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU/RAM
- ✅ Health checks automáticos
- ✅ Alertas por email/webhook

## 🔐 Seguridad

El despliegue incluye:
- ✅ SSL automático (Let's Encrypt)
- ✅ Variables de entorno seguras
- ✅ Firewall configurado
- ✅ Backups automáticos de MySQL

## 🚀 Escalado

Cuando necesites más recursos:

1. **Vertical**: Aumenta RAM/CPU en Dokploy UI
2. **Horizontal**: Aumenta réplicas de servicios
3. **Base de datos**: Migra a MySQL gestionado (RDS, etc.)

## 📞 Contacto

Si tienes dudas durante el despliegue:
- Revisa la documentación completa
- Consulta los logs en Dokploy
- Verifica el checklist punto por punto

## 🎯 Próximos Pasos

1. **Lee** `DOKPLOY_DEPLOYMENT.md` completo
2. **Ejecuta** `deploy-dokploy.sh`
3. **Sigue** el checklist en `DOKPLOY_CHECKLIST.md`
4. **Despliega** en Dokploy
5. **Disfruta** tu chatbot en producción 🎉

---

## 📝 Notas Importantes

- ⚠️ **No compartas** tus API keys públicamente
- ⚠️ **Guarda** todas las contraseñas de forma segura
- ⚠️ **Haz backup** antes de cambios importantes
- ⚠️ **Monitorea** el uso de recursos regularmente

---

**¿Listo para desplegar?** 

👉 Empieza con: `DOKPLOY_DEPLOYMENT.md`

**¡Éxito con tu despliegue! 🚀**
