# Internationalization (i18n) Guide

## Overview

This guide explains how to work with internationalization in the Chatbot SaaS Dashboard. The application uses [next-intl](https://next-intl-docs.vercel.app/) for managing translations and supports Spanish (default) and English.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Adding New Translations](#adding-new-translations)
3. [Adding New Languages](#adding-new-languages)
4. [Translation Key Naming Conventions](#translation-key-naming-conventions)
5. [Using Translations in Components](#using-translations-in-components)
6. [Formatting Dates, Numbers, and Currency](#formatting-dates-numbers-and-currency)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Current Setup

- **Default Language**: Spanish (`es`)
- **Available Languages**: Spanish (`es`), English (`en`)
- **Translation Files**: `dashboard/messages/es.json` and `dashboard/messages/en.json`
- **Language Selector**: Available in the top navigation bar

### Basic Usage

```typescript
'use client'

import { useTranslations } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('mySection')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}
```

---

## Adding New Translations

### Step 1: Identify the Section

Determine which section your translation belongs to. Common sections include:
- `common` - Shared across all pages
- `auth` - Authentication pages
- `dashboard` - Dashboard navigation
- `chatbots` - Chatbots feature
- `conversations` - Conversations feature
- `admin` - Admin panel
- `errors` - Error messages
- `validation` - Form validation

### Step 2: Add to Spanish Translation File

Open `dashboard/messages/es.json` and add your translation key:

```json
{
  "chatbots": {
    "title": "Chatbots",
    "create": "Crear Chatbot",
    "newKey": "Tu nueva traducción en español"
  }
}
```

### Step 3: Add to English Translation File

Open `dashboard/messages/en.json` and add the same key with English translation:

```json
{
  "chatbots": {
    "title": "Chatbots",
    "create": "Create Chatbot",
    "newKey": "Your new translation in English"
  }
}
```

### Step 4: Use in Your Component

```typescript
const t = useTranslations('chatbots')
return <p>{t('newKey')}</p>
```

### Translations with Variables

For dynamic content, use placeholders:

**In translation files:**
```json
{
  "messages": {
    "greeting": "Hola, {name}!",
    "itemCount": "Tienes {count} elementos"
  }
}
```

**In your component:**
```typescript
const t = useTranslations('messages')

<p>{t('greeting', { name: 'Juan' })}</p>
// Output: "Hola, Juan!"

<p>{t('itemCount', { count: 5 })}</p>
// Output: "Tienes 5 elementos"
```

### Pluralization

For plural forms, use the `rich` parameter:

**In translation files:**
```json
{
  "messages": {
    "notifications": "{count, plural, =0 {No tienes notificaciones} =1 {Tienes 1 notificación} other {Tienes # notificaciones}}"
  }
}
```

**In your component:**
```typescript
const t = useTranslations('messages')
<p>{t('notifications', { count: 0 })}</p>
// Output: "No tienes notificaciones"
```

---

## Adding New Languages

### Step 1: Update i18n Configuration

Open `dashboard/i18n.ts` and add the new locale:

```typescript
export const locales = ['es', 'en', 'pt'] as const; // Added Portuguese
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'es';

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português', // Added Portuguese
};
```

### Step 2: Create Translation File

Create a new translation file in `dashboard/messages/`:

```bash
# Copy the Spanish file as a template
cp dashboard/messages/es.json dashboard/messages/pt.json
```

Then translate all strings in `pt.json` to Portuguese.

### Step 3: Update Middleware (if needed)

The middleware in `dashboard/middleware.ts` automatically picks up new locales from the configuration. No changes needed unless you want custom routing behavior.

### Step 4: Test the New Language

1. Restart the development server
2. Use the language selector to switch to the new language
3. Navigate through all pages to verify translations

---

## Translation Key Naming Conventions

### General Rules

1. **Use camelCase** for translation keys
   ```json
   {
     "mySection": {
       "buttonLabel": "Click Me",
       "errorMessage": "Something went wrong"
     }
   }
   ```

2. **Use descriptive names** that indicate the content
   ```json
   // ✅ Good
   {
     "chatbots": {
       "createButton": "Crear Chatbot",
       "deleteConfirmation": "¿Estás seguro?"
     }
   }
   
   // ❌ Bad
   {
     "chatbots": {
       "btn1": "Crear Chatbot",
       "msg": "¿Estás seguro?"
     }
   }
   ```

3. **Group related translations** under common sections
   ```json
   {
     "chatbots": {
       "list": {
         "title": "Mis Chatbots",
         "empty": "No hay chatbots"
       },
       "form": {
         "name": "Nombre",
         "description": "Descripción"
       }
     }
   }
   ```

### Section Organization

```
common/          → Shared UI elements (buttons, labels, actions)
auth/            → Authentication and authorization
dashboard/       → Main dashboard navigation
[feature]/       → Feature-specific translations (chatbots, conversations, etc.)
admin/           → Admin panel sections
  admin.common/  → Shared admin UI
  admin.users/   → User management
  admin.plans/   → Plan management
errors/          → Error messages
validation/      → Form validation messages
```

### Naming Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Page titles | `title` | `"chatbots.title": "Chatbots"` |
| Buttons | `[action]Button` or just `[action]` | `"createButton": "Crear"` |
| Form fields | `[fieldName]` | `"email": "Correo"` |
| Placeholders | `[fieldName]Placeholder` | `"emailPlaceholder": "tu@email.com"` |
| Validation | `[fieldName]Error` | `"emailError": "Email inválido"` |
| Confirmations | `[action]Confirmation` | `"deleteConfirmation": "¿Eliminar?"` |
| Status labels | `status[State]` | `"statusActive": "Activo"` |

### Examples

```json
{
  "chatbots": {
    "title": "Chatbots",
    "subtitle": "Gestiona tus chatbots",
    "create": "Crear Chatbot",
    "edit": "Editar",
    "delete": "Eliminar",
    "deleteConfirmation": "¿Estás seguro de que quieres eliminar este chatbot?",
    
    "form": {
      "name": "Nombre",
      "namePlaceholder": "Nombre del chatbot",
      "nameError": "El nombre es requerido",
      "description": "Descripción",
      "descriptionPlaceholder": "Describe tu chatbot",
      "aiProvider": "Proveedor de IA",
      "aiModel": "Modelo de IA"
    },
    
    "status": {
      "active": "Activo",
      "inactive": "Inactivo",
      "training": "Entrenando"
    },
    
    "messages": {
      "created": "Chatbot creado exitosamente",
      "updated": "Chatbot actualizado",
      "deleted": "Chatbot eliminado",
      "error": "Error al procesar la solicitud"
    }
  }
}
```

---

## Using Translations in Components

### Client Components

For client components (with `'use client'` directive):

```typescript
'use client'

import { useTranslations } from 'next-intl'

export default function ChatbotsList() {
  const t = useTranslations('chatbots')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('create')}</button>
    </div>
  )
}
```

### Server Components

For server components (default in Next.js App Router):

```typescript
import { useTranslations } from 'next-intl'

export default function ChatbotsPage() {
  const t = useTranslations('chatbots')
  
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  )
}
```

### Multiple Translation Sections

```typescript
const t = useTranslations('chatbots')
const tCommon = useTranslations('common')

return (
  <div>
    <h1>{t('title')}</h1>
    <button>{tCommon('save')}</button>
    <button>{tCommon('cancel')}</button>
  </div>
)
```

### Nested Keys

```typescript
const t = useTranslations('chatbots.form')

return (
  <div>
    <label>{t('name')}</label>
    <input placeholder={t('namePlaceholder')} />
  </div>
)
```

---

## Formatting Dates, Numbers, and Currency

### Using the Formatter Hook

```typescript
import { useFormatter } from 'next-intl'

export default function MyComponent() {
  const format = useFormatter()
  
  // ... component code
}
```

### Date Formatting

```typescript
const format = useFormatter()
const date = new Date('2025-11-19')

// Short date format
// Spanish: "19/11/2025"
// English: "11/19/2025"
<p>{format.dateTime(date, { dateStyle: 'short' })}</p>

// Medium date format
// Spanish: "19 nov 2025"
// English: "Nov 19, 2025"
<p>{format.dateTime(date, { dateStyle: 'medium' })}</p>

// Long date format
// Spanish: "19 de noviembre de 2025"
// English: "November 19, 2025"
<p>{format.dateTime(date, { dateStyle: 'long' })}</p>

// Custom format
<p>{format.dateTime(date, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}</p>

// Date and time
<p>{format.dateTime(date, {
  dateStyle: 'short',
  timeStyle: 'short'
})}</p>
```

### Number Formatting

```typescript
const format = useFormatter()

// Basic number
// Spanish: "1.234,56"
// English: "1,234.56"
<p>{format.number(1234.56)}</p>

// With options
<p>{format.number(1234.56, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}</p>

// Percentage
// Output: "75%"
<p>{format.number(0.75, { style: 'percent' })}</p>
```

### Currency Formatting

```typescript
const format = useFormatter()

// Currency
// Spanish: "1.234,56 €"
// English: "$1,234.56"
<p>{format.number(1234.56, {
  style: 'currency',
  currency: 'USD'
})}</p>

// Different currencies
<p>{format.number(1234.56, {
  style: 'currency',
  currency: 'EUR'
})}</p>

<p>{format.number(1234.56, {
  style: 'currency',
  currency: 'MXN'
})}</p>
```

### Relative Time

```typescript
const format = useFormatter()

// Relative time
// Spanish: "hace 2 días"
// English: "2 days ago"
<p>{format.relativeTime(new Date('2025-11-17'))}</p>
```

---

## Best Practices

### 1. Always Provide Both Languages

When adding a new translation key, always add it to both `es.json` and `en.json` files.

```json
// ✅ Good - Both files updated
// es.json
{ "newFeature": { "title": "Nueva Función" } }

// en.json
{ "newFeature": { "title": "New Feature" } }
```

### 2. Use Consistent Key Structure

Keep the same structure across all language files:

```json
// ✅ Good - Same structure
// es.json
{
  "chatbots": {
    "title": "Chatbots",
    "create": "Crear"
  }
}

// en.json
{
  "chatbots": {
    "title": "Chatbots",
    "create": "Create"
  }
}
```

### 3. Avoid Hardcoded Strings

```typescript
// ❌ Bad
<button>Crear Chatbot</button>

// ✅ Good
const t = useTranslations('chatbots')
<button>{t('create')}</button>
```

### 4. Keep Translations Close to Usage

Organize translation keys to match your component structure:

```
components/
  chatbots/
    ChatbotsList.tsx    → uses 'chatbots.list'
    ChatbotForm.tsx     → uses 'chatbots.form'
```

### 5. Use Descriptive Section Names

```json
// ❌ Bad
{ "page1": { "text1": "..." } }

// ✅ Good
{ "chatbots": { "title": "..." } }
```

### 6. Handle Missing Translations Gracefully

The system will fall back to the translation key if a translation is missing. Always test both languages.

### 7. Use Variables for Dynamic Content

```json
// ✅ Good
{
  "welcome": "Bienvenido, {name}!",
  "itemsCount": "Tienes {count} elementos"
}
```

### 8. Keep Translations Short and Clear

Translations should be concise and easy to understand:

```json
// ❌ Bad - Too verbose
{ "deleteButton": "Haz clic aquí para eliminar este elemento de forma permanente" }

// ✅ Good - Clear and concise
{ "delete": "Eliminar" }
```

---

## Troubleshooting

### Translation Not Showing

**Problem**: Translation key shows instead of translated text

**Solutions**:
1. Check that the key exists in both `es.json` and `en.json`
2. Verify the section name matches: `useTranslations('sectionName')`
3. Restart the development server
4. Clear browser cache

### Language Not Switching

**Problem**: Language selector doesn't change the language

**Solutions**:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Clear localStorage: `localStorage.removeItem('preferred-locale')`
4. Check middleware configuration in `middleware.ts`

### Date/Number Format Not Changing

**Problem**: Dates and numbers don't format according to locale

**Solutions**:
1. Use `useFormatter()` hook instead of manual formatting
2. Verify locale is correctly set
3. Check that you're using the formatter methods correctly

### Missing Translation File

**Problem**: 404 error or "Cannot find module" error

**Solutions**:
1. Verify translation files exist in `dashboard/messages/`
2. Check file names match locale codes exactly (`es.json`, `en.json`)
3. Ensure JSON files are valid (no syntax errors)

### TypeScript Errors

**Problem**: TypeScript complains about translation keys

**Solutions**:
1. Restart TypeScript server in your IDE
2. Run `npm run build` to regenerate types
3. Check that all translation keys match across language files

---

## Additional Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [next-intl documentation](https://next-intl-docs.vercel.app/)
2. Review existing translation usage in the codebase
3. Ask the development team for assistance

---

**Last Updated**: November 2025
