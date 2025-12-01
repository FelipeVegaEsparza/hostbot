# ✅ Checklist de Despliegue en Dokploy

Usa este checklist para asegurarte de que todo está configurado correctamente.

## 📋 Pre-Despliegue

### Preparación Local
- [ ] Proyecto en GitHub
- [ ] Todos los cambios commiteados
- [ ] Branch principal actualizado (`main` o `master`)
- [ ] Archivos `.env.example` en cada servicio
- [ ] Dockerfiles verificados y funcionando
- [ ] `dokploy.json` creado
- [ ] `DOKPLOY_DEPLOYMENT.md` revisado

### Credenciales y API Keys
- [ ] OpenAI API Key (REQUERIDO)
- [ ] Anthropic API Key (opcional)
- [ ] Groq API Key (opcional)
- [ ] Google AI API Key (opcional)
- [ ] Mistral API Key (opcional)
- [ ] Cohere API Key (opcional)
- [ ] WhatsApp Cloud API credentials (opcional)
- [ ] Flow API credentials (opcional - pagos CLP)
- [ ] PayPal credentials (opcional - pagos USD)

### Infraestructura
- [ ] Servidor VPS contratado
- [ ] Dokploy instalado en el servidor
- [ ] Acceso al panel de Dokploy (puerto 3000)
- [ ] Dominio(s) comprado(s)
- [ ] DNS configurado para apuntar al servidor

## 🚀 Despliegue en Dokploy

### Paso 1: Proyecto
- [ ] Proyecto creado en Dokploy
- [ ] Nombre: `chatbot-saas`
- [ ] Repositorio de GitHub conectado
- [ ] Branch seleccionado: `main`
- [ ] Auto-deploy habilitado

### Paso 2: Base de Datos MySQL
- [ ] Servicio MySQL creado
- [ ] Nombre: `chatbot-mysql`
- [ ] Versión: MySQL 8.0
- [ ] Database: `chatbot_saas`
- [ ] Username: `chatbot_user`
- [ ] Password generado y guardado
- [ ] Storage: 10GB
- [ ] Backup automático habilitado
- [ ] Connection string copiada

### Paso 3: Redis
- [ ] Servicio Redis creado
- [ ] Nombre: `chatbot-redis`
- [ ] Versión: Redis 7
- [ ] Storage: 2GB
- [ ] Persistencia habilitada
- [ ] Connection string copiada

### Paso 4: Backend API
- [ ] Servicio creado
- [ ] Nombre: `backend-api`
- [ ] Build context: `./backend`
- [ ] Dockerfile: `./backend/Dockerfile`
- [ ] Puerto: 3000
- [ ] Variables de entorno configuradas:
  - [ ] `DATABASE_URL`
  - [ ] `REDIS_URL`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `CORS_ORIGINS`
  - [ ] `OPENAI_API_KEY`
  - [ ] Otras API keys necesarias
- [ ] Health check configurado: `/health`
- [ ] Recursos asignados: 1GB RAM, 1 CPU
- [ ] Servicio desplegado exitosamente
- [ ] Logs sin errores críticos

### Paso 5: Migraciones de Base de Datos
- [ ] Acceso a consola del backend
- [ ] `npm run prisma:generate` ejecutado
- [ ] `npm run prisma:migrate:deploy` ejecutado
- [ ] `npm run prisma:seed` ejecutado (opcional)
- [ ] Tablas creadas en MySQL verificadas

### Paso 6: WhatsApp QR Service
- [ ] Servicio creado
- [ ] Nombre: `whatsapp-qr`
- [ ] Build context: `./whatsapp-qr-service`
- [ ] Puerto: 3002
- [ ] Variables de entorno configuradas:
  - [ ] `PORT=3002`
  - [ ] `NODE_ENV=production`
  - [ ] `BACKEND_API_URL=http://backend-api:3000`
  - [ ] `SESSIONS_DIR=/app/sessions`
- [ ] Volumen persistente configurado: `/app/sessions` (5GB)
- [ ] Recursos asignados: 512MB RAM, 0.5 CPU
- [ ] Servicio desplegado exitosamente
- [ ] Logs sin errores

### Paso 7: Dashboard
- [ ] Servicio creado
- [ ] Nombre: `dashboard`
- [ ] Build context: `./dashboard`
- [ ] Puerto: 3001
- [ ] Variables de entorno configuradas:
  - [ ] `NEXT_PUBLIC_API_URL=https://api.tudominio.com`
  - [ ] `NEXT_PUBLIC_WS_URL=wss://api.tudominio.com`
  - [ ] `NEXT_PUBLIC_APP_URL=https://dashboard.tudominio.com`
  - [ ] `NODE_ENV=production`
- [ ] Recursos asignados: 512MB RAM, 0.5 CPU
- [ ] Servicio desplegado exitosamente
- [ ] Build completado sin errores

### Paso 8: Widget
- [ ] Servicio creado
- [ ] Nombre: `widget`
- [ ] Build context: `./widget`
- [ ] Puerto: 4321
- [ ] Variables de entorno configuradas:
  - [ ] `PUBLIC_API_URL=https://api.tudominio.com`
  - [ ] `NODE_ENV=production`
- [ ] Recursos asignados: 256MB RAM, 0.25 CPU
- [ ] Servicio desplegado exitosamente

## 🌐 Configuración de Dominios

### DNS
- [ ] Registro A para `api.tudominio.com` → IP del servidor
- [ ] Registro A para `dashboard.tudominio.com` → IP del servidor
- [ ] Registro A para `widget.tudominio.com` → IP del servidor
- [ ] Propagación DNS verificada (puede tomar hasta 48h)

### SSL en Dokploy
- [ ] Dominio configurado para Backend: `api.tudominio.com`
- [ ] Auto SSL habilitado para Backend
- [ ] Certificado SSL generado para Backend
- [ ] Dominio configurado para Dashboard: `dashboard.tudominio.com`
- [ ] Auto SSL habilitado para Dashboard
- [ ] Certificado SSL generado para Dashboard
- [ ] Dominio configurado para Widget: `widget.tudominio.com`
- [ ] Auto SSL habilitado para Widget
- [ ] Certificado SSL generado para Widget

## ✅ Verificación Post-Despliegue

### Tests de Conectividad
- [ ] `curl https://api.tudominio.com/health` responde OK
- [ ] `curl https://api.tudominio.com/api/docs` muestra Swagger
- [ ] `https://dashboard.tudominio.com` carga correctamente
- [ ] `https://widget.tudominio.com` carga correctamente
- [ ] WebSocket conecta correctamente

### Tests Funcionales
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Creación de chatbot funciona
- [ ] Envío de mensaje de prueba funciona
- [ ] Respuesta de IA se genera correctamente
- [ ] Widget se puede embeber en una página
- [ ] WhatsApp QR genera código QR
- [ ] Conexión WhatsApp funciona (si aplica)

### Verificación de Logs
- [ ] Backend: Sin errores críticos
- [ ] WhatsApp QR: Sin errores críticos
- [ ] Dashboard: Sin errores de build
- [ ] Widget: Sin errores de build
- [ ] MySQL: Conectado y funcionando
- [ ] Redis: Conectado y funcionando

### Verificación de Recursos
- [ ] Uso de CPU < 80%
- [ ] Uso de RAM < 85%
- [ ] Uso de disco < 80%
- [ ] Todos los servicios en estado "Running"

## 🔧 Configuración Adicional

### Monitoreo
- [ ] Alertas configuradas en Dokploy
- [ ] Email de notificaciones configurado
- [ ] Webhook de Slack/Discord configurado (opcional)

### Backups
- [ ] Backup automático de MySQL habilitado
- [ ] Frecuencia de backup: Diaria
- [ ] Retención de backups: 7 días
- [ ] Backup manual realizado y verificado

### Seguridad
- [ ] Firewall configurado en el servidor
- [ ] Solo puertos necesarios abiertos (22, 80, 443, 3000)
- [ ] Contraseñas seguras para todas las bases de datos
- [ ] JWT_SECRET es suficientemente largo y aleatorio
- [ ] API Keys guardadas de forma segura

### CI/CD
- [ ] Webhook de GitHub configurado
- [ ] Auto-deploy funciona al hacer push
- [ ] Notificaciones de deploy configuradas

## 📱 Configuración de Aplicación

### Primer Usuario Admin
- [ ] Usuario admin creado
- [ ] Email: _______________
- [ ] Password guardado de forma segura
- [ ] Login verificado

### Primer Chatbot
- [ ] Chatbot de prueba creado
- [ ] Nombre: _______________
- [ ] Proveedor de IA configurado
- [ ] Modelo seleccionado
- [ ] Mensaje de prueba enviado
- [ ] Respuesta recibida correctamente

### WhatsApp (si aplica)
- [ ] Cuenta de WhatsApp Business configurada
- [ ] Código QR generado
- [ ] WhatsApp conectado
- [ ] Mensaje de prueba enviado
- [ ] Respuesta recibida en WhatsApp

### Widget
- [ ] Widget personalizado con colores de marca
- [ ] Código de embed generado
- [ ] Widget probado en página de prueba
- [ ] Widget funciona correctamente

## 📊 Métricas y Monitoreo

### Verificación de Performance
- [ ] Tiempo de respuesta API < 500ms
- [ ] Tiempo de carga Dashboard < 3s
- [ ] Tiempo de carga Widget < 2s
- [ ] Respuestas de IA < 10s

### Verificación de Colas
- [ ] Cola `incoming-messages` procesando
- [ ] Cola `ai-processing` procesando
- [ ] Cola `outgoing-messages` procesando
- [ ] No hay trabajos stuck en estado "active"

## 🎉 Finalización

### Documentación
- [ ] URLs de producción documentadas
- [ ] Credenciales guardadas en gestor de contraseñas
- [ ] Guía de uso creada para el equipo
- [ ] Procedimientos de emergencia documentados

### Comunicación
- [ ] Equipo notificado del despliegue
- [ ] URLs compartidas con stakeholders
- [ ] Capacitación programada (si aplica)

### Próximos Pasos
- [ ] Plan de monitoreo definido
- [ ] Plan de escalado definido
- [ ] Plan de mantenimiento definido
- [ ] Roadmap de features futuras

---

## 📝 Notas

**Fecha de despliegue**: _______________

**Versión desplegada**: _______________

**Responsable**: _______________

**Incidencias durante el despliegue**:
- 
- 
- 

**Observaciones**:
- 
- 
- 

---

## 🆘 En Caso de Problemas

Si algo no funciona:

1. ✅ Revisa este checklist punto por punto
2. 📋 Consulta `DOKPLOY_DEPLOYMENT.md` para instrucciones detalladas
3. 🔍 Revisa los logs en Dokploy UI
4. 🛠️ Consulta `DOKPLOY_COMMANDS.md` para comandos útiles
5. 📖 Revisa `backend/docs/TROUBLESHOOTING_GUIDE.md`
6. 💬 Contacta al equipo de soporte

---

**¡Éxito en tu despliegue! 🚀**
