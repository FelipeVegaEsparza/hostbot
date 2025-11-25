# API Backend - SaaS Chatbots con IA

API REST construida con NestJS que maneja toda la lógica de negocio del sistema de chatbots.

## 🏗️ Arquitectura

El backend está organizado en módulos NestJS independientes:

- **auth**: Autenticación y autorización con JWT
- **users**: Gestión de usuarios y clientes
- **billing**: Planes, suscripciones y facturación
- **chatbots**: CRUD de chatbots y configuración
- **messages**: Gestión de mensajes
- **conversations**: Gestión de conversaciones
- **knowledge**: Bases de conocimiento
- **whatsapp-cloud**: Integración con WhatsApp Cloud API
- **whatsapp-qr**: Integración con servicio WhatsApp QR
- **ai**: Sistema multivendor de IA
- **webhooks**: Gestión de webhooks
- **payments**: Integración con Flow y PayPal
- **queues**: Procesamiento asíncrono con BullMQ

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- MySQL 8+
- Redis 7+

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar .env con tus credenciales

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Seed de datos iniciales (opcional)
npm run prisma:seed
```

### Desarrollo

```bash
# Modo desarrollo con hot-reload
npm run start:dev

# Ver logs
# Los logs se guardan en ./logs/

# Acceder a Swagger
# http://localhost:3000/api/docs
```

### Producción

```bash
# Build
npm run build

# Iniciar
npm run start:prod
```

## 📁 Estructura del Proyecto

```
/backend
  /src
    /modules          # Módulos de negocio
      /auth
      /users
      /billing
      /chatbots
      /messages
      /conversations
      /knowledge
      /whatsapp-cloud
      /whatsapp-qr
      /ai
        /providers    # Implementaciones de proveedores de IA
      /webhooks
      /payments
        /providers    # Implementaciones de pasarelas de pago
      /queues
        /processors   # Procesadores de colas
    /common           # Código compartido
      /decorators
      /filters
      /guards
      /interceptors
    /config           # Configuración
    /prisma           # Prisma ORM
      schema.prisma
    main.ts
    app.module.ts
  /logs               # Logs de aplicación
  /prisma
    /migrations       # Migraciones de base de datos
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev         # Iniciar en modo desarrollo
npm run start:debug       # Iniciar con debugger

# Build
npm run build             # Compilar TypeScript
npm run start:prod        # Iniciar en producción

# Testing
npm run test              # Tests unitarios
npm run test:watch        # Tests en modo watch
npm run test:cov          # Tests con cobertura
npm run test:e2e          # Tests end-to-end

# Prisma
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio
npm run prisma:seed       # Seed de datos

# Linting
npm run lint              # Ejecutar ESLint
npm run format            # Formatear con Prettier
```

## 🔑 Variables de Entorno

Ver `.env.example` para la lista completa. Variables principales:

### Base de Datos
```env
DATABASE_URL="mysql://user:password@localhost:3306/chatbot_db"
```

### Redis
```env
REDIS_URL="redis://localhost:6379"
```

### JWT
```env
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRATION="24h"
```

### Proveedores de IA
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."
GOOGLE_AI_API_KEY="..."
MISTRAL_API_KEY="..."
COHERE_API_KEY="..."
LLAMA_API_KEY="..."
```

### WhatsApp
```env
WHATSAPP_QR_SERVICE_URL="http://localhost:3001"
```

### Pagos
```env
FLOW_API_KEY="..."
FLOW_SECRET_KEY="..."
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="sandbox"
```

### Exchange Rates
```env
EXCHANGE_RATE_API_KEY="..."
```

### Aplicación
```env
PORT=3000
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3001,http://localhost:3002"
```

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar todos los tests
npm run test

# Tests específicos
npm run test -- auth.service.spec.ts

# Con cobertura
npm run test:cov
```

### Tests E2E

```bash
# Ejecutar tests e2e
npm run test:e2e

# Tests e2e específicos
npm run test:e2e -- auth.e2e-spec.ts
```

## 📊 Base de Datos

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset de base de datos (desarrollo)
npx prisma migrate reset
```

### Prisma Studio

```bash
# Abrir interfaz visual de base de datos
npm run prisma:studio
```

## 🔌 API Endpoints

### Autenticación
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener perfil actual

### Chatbots
- `GET /chatbots` - Listar chatbots
- `POST /chatbots` - Crear chatbot
- `GET /chatbots/:id` - Obtener chatbot
- `PATCH /chatbots/:id` - Actualizar chatbot
- `DELETE /chatbots/:id` - Eliminar chatbot

### Conversaciones
- `GET /conversations` - Listar conversaciones
- `GET /conversations/:id` - Obtener conversación
- `GET /conversations/:id/messages` - Obtener mensajes

### Mensajes
- `POST /messages/send` - Enviar mensaje

### WhatsApp Cloud
- `POST /whatsapp-cloud/webhook` - Webhook de Meta
- `POST /whatsapp-cloud/send` - Enviar mensaje

### WhatsApp QR
- `POST /whatsapp-qr/init` - Iniciar sesión
- `GET /whatsapp-qr/qr-code/:sessionId` - Obtener QR
- `GET /whatsapp-qr/status/:sessionId` - Estado de sesión
- `POST /whatsapp-qr/send` - Enviar mensaje
- `POST /whatsapp-qr/disconnect` - Desconectar sesión

### IA
- `POST /ai/ask` - Consulta a IA
- `POST /ai/generate` - Generar respuesta
- `POST /ai/chat` - Chat con IA

### Pagos
- `POST /payments/flow/create` - Crear pago Flow
- `POST /payments/flow/webhook` - Webhook Flow
- `POST /payments/paypal/create` - Crear pago PayPal
- `POST /payments/paypal/webhook` - Webhook PayPal

### Facturación
- `GET /billing/invoices` - Listar facturas
- `GET /billing/invoices/:id/pdf` - Descargar factura PDF
- `GET /billing/subscription` - Obtener suscripción actual
- `POST /billing/subscription/change-plan` - Cambiar plan

### Health
- `GET /health` - Health check

Ver documentación completa en `/api/docs` (Swagger).

## 🔒 Seguridad

### Autenticación

El sistema usa JWT para autenticación:

```typescript
// Proteger endpoint con JWT
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

### API Keys

También soporta autenticación con API Keys:

```typescript
// Proteger endpoint con API Key
@UseGuards(ApiKeyGuard)
@Post('webhook')
handleWebhook(@Body() data: any) {
  // ...
}
```

### Rate Limiting

Rate limiting global configurado en `main.ts`:
- 100 requests por 15 minutos por IP

### Validación

Todos los DTOs usan `class-validator`:

```typescript
export class CreateChatbotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

## 📝 Logging

El sistema usa Winston para logging estructurado:

```typescript
// En cualquier servicio
this.logger.log('Mensaje informativo', 'ContextName');
this.logger.error('Error ocurrido', trace, 'ContextName');
this.logger.warn('Advertencia', 'ContextName');
this.logger.debug('Debug info', 'ContextName');
```

Logs se guardan en:
- `./logs/error.log` - Solo errores
- `./logs/combined.log` - Todos los logs

## 🚀 Despliegue

### Con Docker

```bash
# Build de imagen
docker build -t chatbot-api .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env chatbot-api
```

### Con Docker Compose

Ver archivo `docker-compose.yml` en la raíz del proyecto.

## 🐛 Debugging

### VS Code

Configuración en `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "console": "integratedTerminal"
}
```

### Logs

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Ver solo errores
tail -f logs/error.log
```

## 📚 Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [BullMQ Documentation](https://docs.bullmq.io/)

## 🤝 Contribuir

1. Crear rama desde `develop`
2. Seguir convenciones de código (ESLint + Prettier)
3. Escribir tests para nuevas funcionalidades
4. Actualizar documentación si es necesario
5. Crear Pull Request

## 📞 Soporte

Para problemas o preguntas sobre el backend, crear un issue en GitHub.
