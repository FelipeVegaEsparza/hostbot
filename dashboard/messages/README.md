# Translation Files

This directory contains translation files for the Chatbot SaaS Dashboard.

## 📁 Files

- **`es.json`** - Spanish translations (default language)
- **`en.json`** - English translations

## 🎯 Structure

Translation files are organized by feature/section:

```json
{
  "common": {},           // Shared UI elements (buttons, labels, actions)
  "auth": {},            // Authentication pages (login, register)
  "dashboard": {},       // Dashboard navigation and main page
  "chatbots": {},        // Chatbots feature
  "conversations": {},   // Conversations feature
  "knowledge": {},       // Knowledge base feature
  "whatsapp": {},        // WhatsApp integration
  "billing": {},         // Billing and subscriptions
  "settings": {},        // User settings
  "admin": {             // Admin panel
    "common": {},        // Shared admin UI
    "users": {},         // User management
    "customers": {},     // Customer management
    "plans": {},         // Plan management
    "subscriptions": {} // Subscription management
  },
  "errors": {},          // Error messages
  "validation": {}       // Form validation messages
}
```

## ✏️ Adding New Translations

### Step 1: Add to Spanish (`es.json`)

```json
{
  "myFeature": {
    "title": "Mi Nueva Función",
    "description": "Descripción de la función",
    "createButton": "Crear Nuevo"
  }
}
```

### Step 2: Add to English (`en.json`)

```json
{
  "myFeature": {
    "title": "My New Feature",
    "description": "Feature description",
    "createButton": "Create New"
  }
}
```

### Step 3: Use in Component

```typescript
import { useTranslations } from 'next-intl'

export default function MyFeature() {
  const t = useTranslations('myFeature')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('createButton')}</button>
    </div>
  )
}
```

## 🔤 Naming Conventions

### Use camelCase

```json
{
  "mySection": {
    "buttonLabel": "Click Me",
    "errorMessage": "Something went wrong"
  }
}
```

### Be Descriptive

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

### Common Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Page title | `title` | `"title": "Chatbots"` |
| Subtitle | `subtitle` | `"subtitle": "Gestiona tus chatbots"` |
| Button | `[action]` or `[action]Button` | `"create": "Crear"` |
| Form field | `[fieldName]` | `"email": "Correo"` |
| Placeholder | `[field]Placeholder` | `"emailPlaceholder": "tu@email.com"` |
| Error | `[field]Error` | `"emailError": "Email inválido"` |
| Confirmation | `[action]Confirmation` | `"deleteConfirmation": "¿Eliminar?"` |
| Status | `status[State]` | `"statusActive": "Activo"` |
| Message | `[context]Message` | `"successMessage": "Guardado"` |

## 🔄 Variables in Translations

Use curly braces for dynamic values:

```json
{
  "greeting": "Hola, {name}!",
  "itemCount": "Tienes {count} elementos",
  "dateRange": "Del {startDate} al {endDate}"
}
```

Usage:

```typescript
const t = useTranslations('messages')

<p>{t('greeting', { name: 'Juan' })}</p>
<p>{t('itemCount', { count: 5 })}</p>
```

## 📋 Pluralization

Use ICU message format for plurals:

```json
{
  "notifications": "{count, plural, =0 {No tienes notificaciones} =1 {Tienes 1 notificación} other {Tienes # notificaciones}}"
}
```

## ✅ Best Practices

### 1. Keep Both Files in Sync

Always update both `es.json` and `en.json` when adding new keys.

### 2. Use Consistent Structure

Maintain the same JSON structure across all language files.

### 3. Group Related Keys

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

### 4. Avoid Hardcoded Strings

All user-facing text should be in translation files.

### 5. Keep Translations Concise

```json
// ✅ Good
{ "delete": "Eliminar" }

// ❌ Too verbose
{ "deleteButton": "Haz clic aquí para eliminar este elemento de forma permanente" }
```

### 6. Use Common Section for Shared Text

Don't duplicate common words like "Save", "Cancel", "Delete" across sections.

```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar"
  }
}
```

## 🔍 Finding Translations

### By Feature

- Authentication → `auth`
- Chatbots → `chatbots`
- Conversations → `conversations`
- Knowledge Base → `knowledge`
- WhatsApp → `whatsapp`
- Billing → `billing`
- Admin Panel → `admin.*`

### By Type

- Common UI → `common`
- Error Messages → `errors`
- Form Validation → `validation`

## 🐛 Troubleshooting

### Missing Translation

If a translation key is missing, the key itself will be displayed. Check:

1. Key exists in both `es.json` and `en.json`
2. JSON syntax is valid (no trailing commas, proper quotes)
3. Key path matches usage: `useTranslations('section')` → `t('key')`

### JSON Validation

Use a JSON validator to check for syntax errors:

```bash
# Using Node.js
node -e "JSON.parse(require('fs').readFileSync('messages/es.json'))"
node -e "JSON.parse(require('fs').readFileSync('messages/en.json'))"
```

### Key Consistency

Ensure all keys in `es.json` exist in `en.json` and vice versa.

## 📚 Resources

- **Full i18n Guide**: [../I18N_GUIDE.md](../I18N_GUIDE.md)
- **Quick Reference**: [../I18N_QUICK_REFERENCE.md](../I18N_QUICK_REFERENCE.md)
- **next-intl Docs**: https://next-intl-docs.vercel.app/

## 🤝 Contributing

When adding new features:

1. Create a new section in both translation files
2. Use descriptive, consistent key names
3. Follow the naming conventions above
4. Test in both languages before committing

---

**Current Languages**: 🇪🇸 Spanish (default) | 🇺🇸 English

**Need Help?** See the [I18N_GUIDE.md](../I18N_GUIDE.md) for detailed documentation.
