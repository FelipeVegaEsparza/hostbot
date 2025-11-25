# 🤖 Chatbot SaaS Platform

Plataforma SaaS completa para crear y gestionar chatbots con IA, con soporte para múltiples proveedores de IA, integración con WhatsApp, bases de conocimiento y más.

## 🌟 Características

- ✅ **Multi-IA**: Soporte para OpenAI, Anthropic, Groq, Google AI, Mistral, Cohere
- ✅ **WhatsApp**: Integración con WhatsApp Cloud API y WhatsApp QR (Baileys)
- ✅ **Bases de Conocimiento**: RAG con embeddings y búsqueda semántica
- ✅ **Widget Embebible**: Widget personalizable para sitios web
- ✅ **Dashboard Moderno**: Interfaz premium con glassmorphism y animaciones
- ✅ **Multi-idioma**: Soporte para español e inglés
- ✅ **Sistema de Colas**: Procesamiento asíncrono con BullMQ
- ✅ **Webhooks**: Sistema completo de webhooks para integraciones
- ✅ **Facturación**: Integración con Flow y PayPal
- ✅ **Human Handoff**: Intervención humana en conversaciones

## 🏗️ Arquitectura

```
/chatbot
├── backend/              # API NestJS
├── dashboard/            # Dashboard Next.js
├── landing/              # Landing page Astro
├── widget/               # Widget embebible Astro
├── whatsapp-qr-service/  # Servicio WhatsApp QR
└── docker-compose.yml    # Orquestación de servicios
```

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+
- Docker & Docker Compose
- MySQL 8+
- Redis 7+

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/TU_USUARIO/chatbot-saas.git
cd chatbot-saas
```

2. **Configurar variables de entorno**
```bash
# Backend
cp backend/.env.example backend/.env
# Edita backend/.env con tus credenciales

# Dashboard
cp dashboard/.env.example dashboard/.env
# Edita dashboard/.env
```

3. **Iniciar servicios de base de datos**
```bash
docker-compose up -d mysql redis
```

4. **Instalar dependencias**
```bash
# Backend
cd backend && npm install

# Dashboard
cd ../dashboard && npm install

# WhatsApp Service
cd ../whatsapp-qr-service && npm install

# Widget (opcional)
cd ../widget && npm install
```

5. **Ejecutar migraciones**
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run seed  # Crea usuario admin
```

6. **Iniciar servicios**

Necesitas 4 terminales:

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: WhatsApp Service
cd whatsapp-qr-service && npm run dev

# Terminal 3: Dashboard
cd dashboard && npm run dev

# Terminal 4: Widget (opcional)
cd widget && npm run dev
```

7. **Acceder al sistema**
- Dashboard: http://localhost:3001
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Widget: http://localhost:4321

**Credenciales por defecto:**
- Email: `admin@chatbot.com`
- Password: `Admin123!`

## 🐳 Despliegue con Docker

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📦 Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Backend API | 3000 | API REST NestJS |
| Dashboard | 3001 | Panel de administración |
| WhatsApp QR | 3002 | Servicio WhatsApp |
| Landing | 3005 | Página de aterrizaje |
| Widget | 4321 | Widget embebible |
| MySQL | 3306 | Base de datos |
| Redis | 6379 | Cache y colas |

## 🔧 Tecnologías

### Backend
- NestJS
- Prisma ORM
- BullMQ
- Socket.io
- JWT

### Frontend
- Next.js 14
- React 19
- TailwindCSS
- Framer Motion
- Lucide Icons

### Base de Datos
- MySQL 8
- Redis 7

### IA
- OpenAI
- Anthropic
- Groq
- Google AI
- Mistral
- Cohere

## 📚 Documentación

- [Instalación Completa](INSTALLATION.md)
- [Guía de Despliegue](DEPLOYMENT.md)
- [Configuración de Variables](ENV_CONFIGURATION.md)
- [Inicio Rápido Local](INICIO_RAPIDO.md)
- [Backend README](backend/README.md)
- [Dashboard README](dashboard/README.md)

## 🔐 Seguridad

- Autenticación JWT
- Rate limiting
- CORS configurado
- Validación de datos con class-validator
- Helmet para headers de seguridad
- Protección IDOR

## 🌍 Internacionalización

Soporte completo para:
- 🇪🇸 Español
- 🇬🇧 Inglés

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario.

## 👥 Autor

Tu Nombre - [@tu_usuario](https://github.com/tu_usuario)

## 🙏 Agradecimientos

- NestJS
- Next.js
- Prisma
- Tailwind CSS
- Todos los proveedores de IA

---

**Nota:** Recuerda cambiar las API keys y secretos en producción.
