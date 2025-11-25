# Security Implementation Guide

This document describes the security features implemented in the SaaS Chatbot API.

## Table of Contents

1. [Security Headers (Helmet)](#security-headers-helmet)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation](#input-validation)
4. [HTML Sanitization](#html-sanitization)
5. [Webhook Signature Validation](#webhook-signature-validation)
6. [CORS Configuration](#cors-configuration)
7. [Ownership Guards](#ownership-guards)
8. [API Key Authentication](#api-key-authentication)

---

## Security Headers (Helmet)

Helmet is configured in `main.ts` to set secure HTTP headers:

```typescript
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
```

### Headers Set:
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: SAMEORIGIN
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=15552000; includeSubDomains
- **Content-Security-Policy**: Restricts resource loading

---

## Rate Limiting

Global rate limiting is configured to prevent abuse:

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
```

### Configuration:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Response**: 429 Too Many Requests

### Environment Variables:
```env
RATE_LIMIT_TTL=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX=100     # Maximum requests per window
```

---

## Input Validation

All DTOs are validated using `class-validator`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip non-whitelisted properties
    forbidNonWhitelisted: true,   // Throw error on non-whitelisted properties
    transform: true,              // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Example DTO:
```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateChatbotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(500)
  description?: string;
}
```

---

## HTML Sanitization

All message content is sanitized using DOMPurify to prevent XSS attacks.

### Implementation:

Located in `src/common/utils/sanitizer.util.ts`:

```typescript
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  // Strips all HTML tags
  return purify.sanitize(content, { ALLOWED_TAGS: [] });
}
```

### Usage:
```typescript
import { sanitizeMessageContent } from '../../common/utils/sanitizer.util';

const sanitizedContent = sanitizeMessageContent(userInput);
```

### Applied In:
- `MessagesService.create()` - All message creation
- `MessagesService.send()` - Message sending
- `WhatsAppCloudService.processIncomingMessage()` - WhatsApp messages

---

## Webhook Signature Validation

### WhatsApp Cloud API

Validates webhook signatures from Meta using HMAC SHA-256:

```typescript
import { validateWhatsAppSignature } from '../../common/utils/webhook-signature.util';

const isValid = validateWhatsAppSignature(
  payload,      // Raw request body as string
  signature,    // x-hub-signature-256 header
  appSecret     // WHATSAPP_APP_SECRET from env
);
```

### Flow Payment Gateway

Validates Flow webhook signatures:

```typescript
import { validateFlowSignature } from '../../common/utils/webhook-signature.util';

const isValid = validateFlowSignature(
  payload,      // Raw request body as string
  signature,    // Signature from header
  secretKey     // FLOW_SECRET_KEY from env
);
```

### PayPal

Basic PayPal webhook validation (simplified):

```typescript
import { validatePayPalSignature } from '../../common/utils/webhook-signature.util';

const isValid = validatePayPalSignature(
  payload,      // Webhook payload
  headers,      // Request headers
  webhookId     // PayPal webhook ID
);
```

**Note**: For production, use PayPal's official SDK for complete certificate validation.

### Environment Variables:
```env
WHATSAPP_APP_SECRET="your-whatsapp-app-secret"
FLOW_SECRET_KEY="your-flow-secret-key"
```

---

## CORS Configuration

CORS is configured with environment-based origin validation:

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'];

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
});
```

### Environment Variables:
```env
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:4321,https://yourdomain.com"
```

---

## Ownership Guards

Ensures users can only access resources they own.

### Implementation:

Located in `src/common/guards/ownership.guard.ts`:

```typescript
@Injectable()
export class OwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get ownership config from decorator
    // 2. Extract resource ID from request params
    // 3. Fetch resource from database
    // 4. Verify user's customer ID matches resource owner
    // 5. Throw ForbiddenException if not owner
  }
}
```

### Usage:

```typescript
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';

@Delete(':id')
@UseGuards(JwtAuthGuard, OwnershipGuard)
@CheckOwnership({ 
  model: 'chatbot',        // Prisma model name
  idParam: 'id',           // URL parameter name
  ownerField: 'customerId' // Field that contains owner ID
})
async remove(@Param('id') id: string) {
  // Only executes if user owns the chatbot
}
```

### Applied To:
- Chatbot operations (GET, PATCH, DELETE)
- Conversation access
- Knowledge base operations
- API key management

---

## API Key Authentication

Alternative authentication method for programmatic access.

### Implementation:

Located in `src/common/guards/api-key.guard.ts`:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const apiKey = request.headers['x-api-key'];
    
    // 1. Validate API key exists
    // 2. Check if active in database
    // 3. Update last used timestamp
    // 4. Attach customer to request
  }
}
```

### Usage:

```typescript
@Post('send')
@UseGuards(ApiKeyGuard)
async sendMessage(@Body() dto: SendMessageDto) {
  // Access customer via request.customer
}
```

### API Key Header:
```
x-api-key: your-api-key-here
```

---

## Exception Handling

Global exception filter for consistent error responses:

Located in `src/common/filters/http-exception.filter.ts`:

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Returns standardized error response:
    {
      statusCode: 500,
      timestamp: "2024-01-01T00:00:00.000Z",
      path: "/api/endpoint",
      method: "POST",
      message: "Error message",
      errors: {} // Optional validation errors
    }
  }
}
```

---

## Logging

Request/response logging interceptor:

Located in `src/common/interceptors/logging.interceptor.ts`:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Logs: METHOD URL STATUS DURATION - USER_AGENT IP
    // Example: GET /api/chatbots 200 45ms - Mozilla/5.0 192.168.1.1
  }
}
```

---

## Security Checklist

- [x] Helmet security headers configured
- [x] Rate limiting enabled (100 req/15min)
- [x] Input validation with class-validator
- [x] HTML sanitization for all messages
- [x] WhatsApp webhook signature validation
- [x] Flow webhook signature validation
- [x] PayPal webhook signature validation
- [x] CORS with environment-based origins
- [x] Ownership guards for resource access
- [x] API key authentication
- [x] Global exception handling
- [x] Request/response logging
- [x] JWT authentication with expiration
- [x] Password hashing with bcrypt (factor 10)

---

## Best Practices

1. **Never expose sensitive data in responses**
   - Strip `accessToken`, `password`, etc. from API responses

2. **Always validate input**
   - Use DTOs with class-validator decorators
   - Enable `whitelist` and `forbidNonWhitelisted`

3. **Sanitize user content**
   - Apply `sanitizeMessageContent()` to all user-generated text

4. **Verify webhook signatures**
   - Always validate signatures before processing webhooks

5. **Use ownership guards**
   - Apply to all resource-specific endpoints

6. **Keep secrets in environment variables**
   - Never commit secrets to version control
   - Use `.env.example` for documentation

7. **Monitor rate limits**
   - Adjust limits based on usage patterns
   - Consider per-user rate limiting for authenticated endpoints

8. **Log security events**
   - Failed authentication attempts
   - Invalid webhook signatures
   - Ownership violations

---

## Environment Variables Reference

```env
# Security
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
ALLOWED_ORIGINS="http://localhost:3001,https://yourdomain.com"
RATE_LIMIT_TTL=900000
RATE_LIMIT_MAX=100

# Webhook Validation
WHATSAPP_APP_SECRET="your-whatsapp-app-secret"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
FLOW_SECRET_KEY="your-flow-secret-key"
```

---

## Testing Security Features

### Test Rate Limiting:
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl http://localhost:3000/api/chatbots
done
# Should receive 429 on request 101
```

### Test Webhook Signature:
```bash
# Invalid signature should be rejected
curl -X POST http://localhost:3000/whatsapp-cloud/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=invalid" \
  -d '{"entry": []}'
# Should receive 400 Bad Request
```

### Test Ownership Guard:
```bash
# Try to access another user's chatbot
curl http://localhost:3000/api/chatbots/other-user-chatbot-id \
  -H "Authorization: Bearer YOUR_JWT"
# Should receive 403 Forbidden
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Helmet Documentation](https://helmetjs.github.io/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
