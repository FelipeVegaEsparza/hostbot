# i18n Quick Reference Card

Quick reference for common i18n tasks in the Chatbot SaaS Dashboard.

## 📖 Full Documentation

For detailed information, see [I18N_GUIDE.md](./I18N_GUIDE.md)

---

## 🚀 Quick Start

### Use Translations in Component

```typescript
'use client'
import { useTranslations } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('mySection')
  return <h1>{t('title')}</h1>
}
```

---

## ➕ Add New Translation

### 1. Add to Spanish (`messages/es.json`)

```json
{
  "mySection": {
    "title": "Mi Título",
    "description": "Mi descripción"
  }
}
```

### 2. Add to English (`messages/en.json`)

```json
{
  "mySection": {
    "title": "My Title",
    "description": "My description"
  }
}
```

### 3. Use in Component

```typescript
const t = useTranslations('mySection')
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

---

## 🔤 Translation with Variables

### In Translation Files

```json
{
  "greeting": "Hola, {name}!",
  "itemCount": "Tienes {count} elementos"
}
```

### In Component

```typescript
const t = useTranslations('messages')
<p>{t('greeting', { name: 'Juan' })}</p>
<p>{t('itemCount', { count: 5 })}</p>
```

---

## 📅 Format Dates

```typescript
import { useFormatter } from 'next-intl'

const format = useFormatter()
const date = new Date()

// Short: 19/11/2025 (es) or 11/19/2025 (en)
<p>{format.dateTime(date, { dateStyle: 'short' })}</p>

// Medium: 19 nov 2025 (es) or Nov 19, 2025 (en)
<p>{format.dateTime(date, { dateStyle: 'medium' })}</p>

// Long: 19 de noviembre de 2025 (es) or November 19, 2025 (en)
<p>{format.dateTime(date, { dateStyle: 'long' })}</p>
```

---

## 🔢 Format Numbers

```typescript
import { useFormatter } from 'next-intl'

const format = useFormatter()

// Number: 1.234,56 (es) or 1,234.56 (en)
<p>{format.number(1234.56)}</p>

// Percentage: 75%
<p>{format.number(0.75, { style: 'percent' })}</p>

// Currency: $1,234.56
<p>{format.number(1234.56, {
  style: 'currency',
  currency: 'USD'
})}</p>
```

---

## 🌍 Add New Language

### 1. Update `i18n.ts`

```typescript
export const locales = ['es', 'en', 'pt'] as const;

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português', // New language
};
```

### 2. Create Translation File

```bash
cp messages/es.json messages/pt.json
# Then translate all strings in pt.json
```

### 3. Restart Dev Server

```bash
npm run dev
```

---

## 📁 Translation Key Organization

```
common/          → Shared UI (buttons, labels)
auth/            → Login, register
dashboard/       → Main navigation
[feature]/       → Feature-specific (chatbots, conversations)
admin/           → Admin panel
errors/          → Error messages
validation/      → Form validation
```

---

## 🎯 Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page title | `title` | `"title": "Chatbots"` |
| Button | `[action]` | `"create": "Crear"` |
| Form field | `[fieldName]` | `"email": "Correo"` |
| Placeholder | `[field]Placeholder` | `"emailPlaceholder": "tu@email.com"` |
| Error | `[field]Error` | `"emailError": "Email inválido"` |
| Confirmation | `[action]Confirmation` | `"deleteConfirmation": "¿Eliminar?"` |

---

## 🔍 Common Sections

```typescript
// Common UI elements
const tCommon = useTranslations('common')
tCommon('save')    // "Guardar" / "Save"
tCommon('cancel')  // "Cancelar" / "Cancel"
tCommon('delete')  // "Eliminar" / "Delete"

// Authentication
const tAuth = useTranslations('auth')
tAuth('login')     // "Iniciar Sesión" / "Login"
tAuth('email')     // "Correo Electrónico" / "Email"

// Dashboard
const tDash = useTranslations('dashboard')
tDash('chatbots')  // "Chatbots" / "Chatbots"
```

---

## 🐛 Troubleshooting

### Translation Not Showing?

1. ✅ Check key exists in both `es.json` and `en.json`
2. ✅ Verify section name: `useTranslations('sectionName')`
3. ✅ Restart dev server
4. ✅ Clear browser cache

### Language Not Switching?

1. ✅ Check browser console for errors
2. ✅ Clear localStorage: `localStorage.clear()`
3. ✅ Verify middleware configuration

---

## 📚 Resources

- **Full Guide**: [I18N_GUIDE.md](./I18N_GUIDE.md)
- **next-intl Docs**: https://next-intl-docs.vercel.app/
- **Translation Files**: `dashboard/messages/`

---

**Current Languages**: 🇪🇸 Spanish (default) | 🇺🇸 English
