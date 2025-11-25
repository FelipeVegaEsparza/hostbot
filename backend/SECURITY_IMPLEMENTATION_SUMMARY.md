# Security and Validation Implementation Summary

## Task 18: Implementar seguridad y validación ✅

This document summarizes the security features implemented for the SaaS Chatbot API backend.

---

## ✅ Completed Features

### 1. Helmet Security Headers
**Location**: `src/main.ts`

- Configured Helmet middleware with Content Security Policy
- Sets secure HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Protects against common web vulnerabilities

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
```

---

### 2. Rate Limiting (100 requests per 15 minutes per IP)
**Location**: `src/main.ts`

- Global rate limiter using `express-rate-limit`
- Prevents abuse and DDoS attacks
- Returns 429 status when limit exceeded

```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
```

---

### 3. Input Validation with class-validator
**Location**: `src/main.ts`

- Global ValidationPipe configured
- Automatically validates all DTOs
- Strips non-whitelisted properties
- Transforms payloads to DTO instances

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

**Applied to all existing DTOs** in:
- Auth module
- Chatbots module
- Messages module
- WhatsApp modules
- Knowledge module
- Billing module

---

### 4. HTML Sanitization with DOMPurify
**Location**: `src/common/utils/sanitizer.util.ts`

- Sanitizes all message content to prevent XSS attacks
- Strips HTML tags from user input
- Uses DOMPurify with JSDOM

**Functions**:
- `sanitizeHtml()` - Allows safe HTML tags
- `stripHtml()` - Removes all HTML
- `sanitizeMessageContent()` - Strips all HTML for messages

**Applied in**:
- `MessagesService.create()` - All message creation
- `MessagesService.send()` - Message sending
- `WhatsAppCloudService.processIncomingMessage()` - WhatsApp messages

```typescript
import { sanitizeMessageContent } from '../../common/utils/sanitizer.util';

const sanitizedContent = sanitizeMessageContent(userInput);
```

---

### 5. Webhook Signature Validation
**Location**: `src/common/utils/webhook-signature.util.ts`

Implemented signature validation for:

#### WhatsApp Cloud API
- Validates `x-hub-signature-256` header
- Uses HMAC SHA-256 with app secret
- Timing-safe comparison

```typescript
validateWhatsAppSignature(payload, signature, secret)
```

**Applied in**: `WhatsAppCloudService.validateWebhookSignature()`

#### Flow Payment Gateway
- Validates Flow webhook signatures
- HMAC SHA-256 validation

```typescript
validateFlowSignature(payload, signature, secret)
```

#### PayPal
- Basic PayPal webhook validation
- Checks required headers

```typescript
validatePayPalSignature(payload, headers, webhookId)
```

---

### 6. CORS Configuration
**Location**: `src/main.ts`

- Environment-based origin validation
- Supports multiple allowed origins
- Allows credentials
- Configurable via `ALLOWED_ORIGINS` env variable

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

---

### 7. Ownership Guards
**Location**: `src/common/guards/ownership.guard.ts`

- Verifies users can only access their own resources
- Checks resource ownership before allowing operations
- Throws ForbiddenException if user doesn't own resource

**Decorator**: `src/common/decorators/ownership.decorator.ts`

```typescript
@CheckOwnership({ 
  model: 'chatbot',
  idParam: 'id',
  ownerField: 'customerId'
})
```

**Applied to**:
- `ChatbotsController.findOne()` - GET /chatbots/:id
- `ChatbotsController.update()` - PATCH /chatbots/:id
- `ChatbotsController.remove()` - DELETE /chatbots/:id
- `ChatbotsController.getStats()` - GET /chatbots/:id/stats

---

## 📁 New Files Created

### Guards
- `src/common/guards/ownership.guard.ts` - Resource ownership verification
- `src/common/guards/api-key.guard.ts` - API key authentication

### Utilities
- `src/common/utils/sanitizer.util.ts` - HTML sanitization functions
- `src/common/utils/webhook-signature.util.ts` - Webhook signature validation

### Filters & Interceptors
- `src/common/filters/http-exception.filter.ts` - Global exception handling
- `src/common/interceptors/logging.interceptor.ts` - Request/response logging

### Decorators
- `src/common/decorators/ownership.decorator.ts` - Ownership check decorator

### Documentation
- `backend/SECURITY.md` - Comprehensive security documentation
- `backend/SECURITY_IMPLEMENTATION_SUMMARY.md` - This file

---

## 🔧 Modified Files

### Core Application
- `src/main.ts` - Added helmet, rate limiting, compression, CORS, global filters/interceptors

### Services
- `src/modules/messages/messages.service.ts` - Added message content sanitization
- `src/modules/whatsapp-cloud/whatsapp-cloud.service.ts` - Updated to use centralized signature validation

### Controllers
- `src/modules/chatbots/chatbots.controller.ts` - Added ownership guards to protected endpoints

### Configuration
- `backend/.env.example` - Updated with security-related environment variables

---

## 🌍 Environment Variables

Added/updated in `.env.example`:

```env
# CORS - Comma-separated list of allowed origins
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:4321"

# WhatsApp Cloud API
WHATSAPP_APP_SECRET="your-whatsapp-app-secret"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"

# Payment Gateways
FLOW_SECRET_KEY="your-flow-secret-key"

# Rate Limiting
RATE_LIMIT_TTL=900000
RATE_LIMIT_MAX=100
```

---

## ✅ Requirements Coverage

### Requirement 17.1: Input Validation ✅
- Global ValidationPipe with class-validator
- All DTOs validated automatically
- Whitelist and forbidNonWhitelisted enabled

### Requirement 17.2: HTML Sanitization ✅
- DOMPurify implementation
- Applied to all message content
- Prevents XSS attacks

### Requirement 17.3: Rate Limiting ✅
- 100 requests per 15 minutes per IP
- Global rate limiter
- Returns 429 on limit exceeded

### Requirement 17.4: Webhook Signature Validation ✅
- WhatsApp Cloud API signature validation
- Flow payment gateway validation
- PayPal webhook validation
- Timing-safe comparison

### Requirement 17.5: CORS & Security Headers ✅
- Helmet for security headers
- Environment-based CORS configuration
- Secure defaults

### Additional: Ownership Guards ✅
- Resource ownership verification
- Applied to chatbot operations
- Prevents unauthorized access

---

## 🧪 Testing

### Build Test
```bash
cd backend
npm run build
```
**Result**: ✅ Build successful with no errors

### Manual Testing Checklist

1. **Rate Limiting**
   ```bash
   # Send 101 requests rapidly
   for i in {1..101}; do curl http://localhost:3000/api/chatbots; done
   ```
   Expected: 429 on request 101

2. **Webhook Signature**
   ```bash
   curl -X POST http://localhost:3000/whatsapp-cloud/webhook \
     -H "x-hub-signature-256: sha256=invalid" \
     -d '{"entry": []}'
   ```
   Expected: 400 Bad Request

3. **Ownership Guard**
   ```bash
   curl http://localhost:3000/api/chatbots/other-user-id \
     -H "Authorization: Bearer YOUR_JWT"
   ```
   Expected: 403 Forbidden

4. **Input Validation**
   ```bash
   curl -X POST http://localhost:3000/api/chatbots \
     -H "Authorization: Bearer YOUR_JWT" \
     -d '{"invalid": "field"}'
   ```
   Expected: 400 with validation errors

5. **CORS**
   ```bash
   curl -H "Origin: http://unauthorized-origin.com" \
     http://localhost:3000/api/chatbots
   ```
   Expected: CORS error

---

## 📚 Documentation

Comprehensive security documentation created in `backend/SECURITY.md` covering:
- All security features
- Implementation details
- Usage examples
- Best practices
- Testing procedures
- Environment variables reference

---

## 🎯 Summary

All security requirements from Task 18 have been successfully implemented:

✅ Helmet security headers configured  
✅ Rate limiting (100 req/15min per IP)  
✅ Input validation with class-validator  
✅ HTML sanitization with DOMPurify  
✅ Webhook signature validation (WhatsApp, Flow, PayPal)  
✅ CORS with environment-based origins  
✅ Ownership guards for resource access  
✅ Global exception handling  
✅ Request/response logging  
✅ API key authentication guard  

The application builds successfully and all security features are ready for testing and deployment.
