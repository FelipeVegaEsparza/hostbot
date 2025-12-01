# ⚡ Dokploy - Inicio Rápido (5 minutos)

## 🎯 Lo que vas a hacer

Desplegar tu SaaS de Chatbots completo en Dokploy en ~2 horas.

## 📦 Archivos que tienes

```
📁 Tu Proyecto
├── 📘 README_DOKPLOY.md          ← Empieza aquí (visión general)
├── 📗 DOKPLOY_DEPLOYMENT.md      ← Guía completa paso a paso
├── 📋 DOKPLOY_CHECKLIST.md       ← Checklist mientras despliegas
├── 🛠️ DOKPLOY_COMMANDS.md        ← Comandos útiles (referencia)
├── ⚙️ dokploy.json                ← Configuración de servicios
├── 🚀 deploy-dokploy.sh          ← Script de preparación
└── ⚡ DOKPLOY_QUICK_START.md     ← Este archivo
```

## 🚀 3 Pasos para Desplegar

### 1️⃣ Preparar (5 min)

```bash
# Ejecuta el script de preparación
./deploy-dokploy.sh

# O en Windows PowerShell:
bash deploy-dokploy.sh
```

**Esto genera**:
- ✅ Verificación de archivos
- ✅ Template de variables de entorno
- ✅ Checklist personalizado

### 2️⃣ Push a GitHub (1 min)

```bash
git add .
git commit -m "Ready for Dokploy"
git push origin main
```

### 3️⃣ Desplegar en Dokploy (1-2 horas)

1. Abre Dokploy: `https://tu-servidor.com:3000`
2. Crea proyecto: `chatbot-saas`
3. Conecta GitHub
4. Sigue: `DOKPLOY_DEPLOYMENT.md`

## 🎬 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: PREPARACIÓN LOCAL                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Ejecutar deploy-dokploy.sh                              │
│  2. Revisar archivos generados                              │
│  3. Preparar API keys                                       │
│  4. Push a GitHub                                           │
│                                                             │
│  ⏱️ Tiempo: 5-10 minutos                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: CONFIGURAR BASES DE DATOS                          │
├─────────────────────────────────────────────────────────────┤
│  1. Crear MySQL en Dokploy                                  │
│  2. Crear Redis en Dokploy                                  │
│  3. Copiar connection strings                               │
│                                                             │
│  ⏱️ Tiempo: 5 minutos                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: DESPLEGAR BACKEND                                  │
├─────────────────────────────────────────────────────────────┤
│  1. Crear servicio Backend                                  │
│  2. Configurar variables de entorno                         │
│  3. Deploy y esperar build                                  │
│  4. Ejecutar migraciones                                    │
│                                                             │
│  ⏱️ Tiempo: 20-30 minutos                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: DESPLEGAR OTROS SERVICIOS                          │
├─────────────────────────────────────────────────────────────┤
│  1. WhatsApp QR Service                                     │
│  2. Dashboard                                               │
│  3. Widget                                                  │
│                                                             │
│  ⏱️ Tiempo: 30-40 minutos                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: CONFIGURAR DOMINIOS Y SSL                          │
├─────────────────────────────────────────────────────────────┤
│  1. Configurar DNS                                          │
│  2. Agregar dominios en Dokploy                             │
│  3. Habilitar Auto SSL                                      │
│  4. Esperar certificados                                    │
│                                                             │
│  ⏱️ Tiempo: 15-20 minutos                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: VERIFICAR Y PROBAR                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Verificar health checks                                 │
│  2. Crear usuario admin                                     │
│  3. Crear primer chatbot                                    │
│  4. Probar widget                                           │
│                                                             │
│  ⏱️ Tiempo: 15-30 minutos                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    🎉 ¡LISTO!
```

## 📋 Checklist Ultra-Rápido

### Antes de Empezar
- [ ] Servidor VPS con Dokploy
- [ ] Proyecto en GitHub
- [ ] OpenAI API Key
- [ ] Dominio (opcional)

### Durante el Despliegue
- [ ] MySQL creado
- [ ] Redis creado
- [ ] Backend desplegado
- [ ] Migraciones ejecutadas
- [ ] Otros servicios desplegados
- [ ] Dominios configurados
- [ ] SSL habilitado

### Después del Despliegue
- [ ] Health checks OK
- [ ] Usuario admin creado
- [ ] Primer chatbot creado
- [ ] Todo funciona

## 🔑 Variables de Entorno Mínimas

```env
# Backend (MÍNIMO para empezar)
DATABASE_URL=mysql://...           # Dokploy te lo da
REDIS_URL=redis://...              # Dokploy te lo da
JWT_SECRET=genera-algo-seguro-32+  # Genera uno
OPENAI_API_KEY=sk-...              # Tu API key
CORS_ORIGINS=https://tudominio.com # Tu dominio
```

**Nota**: El script `deploy-dokploy.sh` genera un template completo.

## 🌐 URLs Finales

Después del despliegue tendrás:

```
✅ https://api.tudominio.com          → API Backend
✅ https://api.tudominio.com/api/docs → Documentación Swagger
✅ https://dashboard.tudominio.com    → Panel de Administración
✅ https://widget.tudominio.com       → Widget Embebible
```

## 💡 Tips Importantes

### ✅ DO (Hacer)
- ✅ Lee `DOKPLOY_DEPLOYMENT.md` completo antes de empezar
- ✅ Usa el checklist mientras despliegas
- ✅ Guarda todas las contraseñas de forma segura
- ✅ Verifica los logs después de cada deploy
- ✅ Haz backup de MySQL después del primer despliegue

### ❌ DON'T (No Hacer)
- ❌ No compartas tus API keys
- ❌ No uses contraseñas débiles
- ❌ No ignores los errores en los logs
- ❌ No olvides configurar backups
- ❌ No despliegues sin leer la guía primero

## 🆘 Si Algo Sale Mal

### Problema: Build falla
```
1. Revisa logs en Dokploy UI
2. Verifica que el Dockerfile existe
3. Verifica variables de entorno
```

### Problema: Backend no inicia
```
1. Verifica DATABASE_URL
2. Verifica REDIS_URL
3. Revisa logs del backend
```

### Problema: SSL no se genera
```
1. Verifica DNS (puede tomar hasta 48h)
2. Espera 10 minutos
3. Intenta regenerar en Dokploy
```

### Problema: No sé qué hacer
```
1. Lee DOKPLOY_DEPLOYMENT.md paso a paso
2. Usa DOKPLOY_CHECKLIST.md
3. Consulta DOKPLOY_COMMANDS.md
```

## 📞 Recursos

| Documento | Cuándo Usarlo |
|-----------|---------------|
| `README_DOKPLOY.md` | Visión general y contexto |
| `DOKPLOY_DEPLOYMENT.md` | Guía paso a paso completa |
| `DOKPLOY_CHECKLIST.md` | Mientras despliegas |
| `DOKPLOY_COMMANDS.md` | Después del despliegue |
| `deploy-dokploy.sh` | Antes de empezar |

## ⏱️ Timeline Realista

```
00:00 - Leer documentación
00:15 - Ejecutar script de preparación
00:20 - Push a GitHub
00:25 - Crear proyecto en Dokploy
00:30 - Configurar MySQL y Redis
00:35 - Desplegar Backend
00:55 - Ejecutar migraciones
01:00 - Desplegar WhatsApp QR
01:15 - Desplegar Dashboard
01:30 - Desplegar Widget
01:45 - Configurar dominios y SSL
02:00 - Verificar y probar
02:15 - ¡Listo! 🎉
```

## 🎯 Objetivo Final

Al terminar tendrás:

```
✅ Sistema completo en producción
✅ SSL configurado automáticamente
✅ Backups automáticos
✅ Auto-deploy desde GitHub
✅ Monitoreo incluido
✅ Logs centralizados
✅ Escalable y mantenible
```

## 🚀 ¡Empecemos!

### Paso 1: Lee esto
- [x] `DOKPLOY_QUICK_START.md` (este archivo)

### Paso 2: Lee la guía completa
- [ ] `DOKPLOY_DEPLOYMENT.md`

### Paso 3: Ejecuta el script
- [ ] `./deploy-dokploy.sh`

### Paso 4: Despliega
- [ ] Sigue el checklist en `DOKPLOY_CHECKLIST.md`

---

## 💪 ¡Tú Puedes!

El despliegue puede parecer complejo, pero:
- ✅ Tienes toda la documentación necesaria
- ✅ Tienes scripts de ayuda
- ✅ Tienes checklists detallados
- ✅ Dokploy hace el trabajo pesado

**Solo sigue los pasos y en 2 horas tendrás tu sistema en producción.**

---

## 📚 Orden de Lectura Recomendado

1. ✅ Este archivo (DOKPLOY_QUICK_START.md) - 5 min
2. 📘 README_DOKPLOY.md - 10 min
3. 📗 DOKPLOY_DEPLOYMENT.md - 30 min
4. 🚀 ¡Empezar a desplegar!

---

**¿Listo?** 

👉 Siguiente: `README_DOKPLOY.md`

**¡Éxito! 🚀**
