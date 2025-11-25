import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';
import { CustomLogger } from './common/logger/custom-logger.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

async function bootstrap() {
  // Create app with custom logger
  const customLogger = new CustomLogger();
  customLogger.setContext('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: customLogger,
  });

  // Security: Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Security: Rate limiting (100 requests per 15 minutes per IP)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Performance: Enable compression
  app.use(compression());

  // Enable validation pipes globally with sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Apply correlation ID middleware globally
  app.use(new CorrelationIdMiddleware().use.bind(new CorrelationIdMiddleware()));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global tracing interceptor for request duration tracking
  const tracingLogger = new CustomLogger();
  app.useGlobalInterceptors(new TracingInterceptor(tracingLogger));

  // Enable CORS with environment-based origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3001'];
  customLogger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        customLogger.debug('CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        customLogger.debug(`CORS: Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        customLogger.warn(`CORS: Rejecting origin: ${origin}`);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('SaaS Chatbot API')
    .setDescription('API para gestión de chatbots con IA y WhatsApp')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addTag('auth', 'Autenticación y registro')
    .addTag('users', 'Gestión de usuarios')
    .addTag('chatbots', 'Gestión de chatbots')
    .addTag('conversations', 'Gestión de conversaciones')
    .addTag('messages', 'Mensajes y conversaciones')
    .addTag('whatsapp', 'Integración WhatsApp')
    .addTag('knowledge', 'Base de conocimiento')
    .addTag('AI', 'Proveedores de inteligencia artificial')
    .addTag('widget', 'Widget embebible')
    .addTag('api-keys', 'Gestión de API Keys')
    .addTag('billing', 'Facturación y suscripciones')
    .addTag('health', 'Health checks y monitoreo')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown - Prisma will disconnect automatically via onModuleDestroy
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  customLogger.log(`Application is running on: http://localhost:${port}`);
  customLogger.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  customLogger.log(`Health check available at: http://localhost:${port}/health`);
}

bootstrap();
