# 🔐 Credenciales de Admin y Solución de Errores

## ✅ Problema Resuelto

El error "Failed to call `useTranslations` because the context from `NextIntlClientProvider` was not found" ha sido corregido.

### Causa del Error
El componente de admin estaba usando `useTranslations` y `useFormatter` de `next-intl` directamente, pero como Client Component necesita usar el hook desde el provider personalizado.

### Solución Aplicada
- ✅ Cambiado import de `next-intl` a `@/components/i18n-provider`
- ✅ Removido `useFormatter` y reemplazado con `toLocaleDateString()`
- ✅ Archivo corregido: `dashboard/app/[locale]/(dashboard)/dashboard/admin/page.tsx`

## 🔑 Credenciales de Admin

### Credenciales por Defecto

```
Email:    admin@chatbot.com
Password: Admin123!
```

⚠️ **IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login!

## 🚀 Cómo Acceder al Panel de Admin

### Paso 1: Crear el Usuario Admin

Primero necesitas ejecutar el script de seed para crear el usuario admin:

```bash
cd backend
npm run seed
```

Este comando creará:
- ✅ Usuario admin con las credenciales por defecto
- ✅ Planes por defecto (Free, Pro, Enterprise)

### Paso 2: Iniciar Sesión

1. Abre el dashboard: http://localhost:3001
2. Haz clic en "Iniciar Sesión"
3. Ingresa las credenciales:
   - Email: `admin@chatbot.com`
   - Password: `Admin123!`

### Paso 3: Acceder al Panel de Admin

Una vez autenticado:
1. Verás un enlace "Admin Panel" en el sidebar (solo visible para admins)
2. O navega directamente a: http://localhost:3001/es/dashboard/admin

## 📊 Funcionalidades del Panel de Admin

### Overview (Principal)
- Estadísticas del sistema
- Total de usuarios, clientes, suscripciones
- Chatbots activos/inactivos
- Usuarios recientes

### Users (Usuarios)
- Ver todos los usuarios
- Cambiar roles (USER ↔ ADMIN)
- Buscar y filtrar usuarios

### Customers (Clientes)
- Ver todos los clientes
- Información de suscripciones
- Gestión de clientes

### Plans (Planes)
- Ver planes disponibles
- Crear nuevos planes
- Editar planes existentes

### Subscriptions (Suscripciones)
- Ver todas las suscripciones
- Estado de suscripciones
- Gestión de suscripciones

## 🔧 Planes por Defecto Creados

El script de seed crea estos planes:

### 1. Free Plan
```
Nombre: Free
Precio: $0/mes
Chatbots: 1
Mensajes: 100/mes
```

### 2. Pro Plan
```
Nombre: Pro
Precio: $29.99/mes
Chatbots: 5
Mensajes: 10,000/mes
```

### 3. Enterprise Plan
```
Nombre: Enterprise
Precio: $99.99/mes
Chatbots: Ilimitados
Mensajes: Ilimitados
```

## ⚠️ Solución de Problemas

### Error: "Usuario no encontrado"

Si no puedes iniciar sesión:

1. **Verifica que el backend esté corriendo**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Ejecuta el seed nuevamente**:
   ```bash
   cd backend
   npm run seed
   ```

3. **Verifica la base de datos**:
   - Asegúrate de que MySQL esté corriendo
   - Verifica la conexión en `backend/.env`

### Error: "No tienes permisos"

Si no ves el panel de admin:

1. **Verifica tu rol**:
   - Solo usuarios con rol `ADMIN` pueden acceder
   - El seed crea un usuario admin automáticamente

2. **Limpia el cache**:
   - Cierra sesión
   - Limpia cookies del navegador
   - Inicia sesión nuevamente

### Error: "Failed to call useTranslations"

✅ **YA CORREGIDO** - Si aún ves este error:

1. **Reinicia el servidor del dashboard**:
   ```bash
   cd dashboard
   # Detén con Ctrl+C
   npm run dev
   ```

2. **Limpia el cache de Next.js**:
   ```bash
   cd dashboard
   rm -rf .next
   npm run dev
   ```

## 🔒 Seguridad

### Cambiar Contraseña de Admin

1. Inicia sesión con las credenciales por defecto
2. Ve a Configuración (Settings)
3. Cambia tu contraseña
4. O usa la API directamente:

```bash
# Endpoint para cambiar contraseña
POST /api/auth/change-password
{
  "currentPassword": "Admin123!",
  "newPassword": "TuNuevaContraseñaSegura123!"
}
```

### Variables de Entorno

Puedes configurar las credenciales de admin en el backend:

```env
# backend/.env
ADMIN_EMAIL=admin@chatbot.com
ADMIN_PASSWORD=Admin123!
```

## 📝 Comandos Útiles

### Backend

```bash
# Iniciar backend
cd backend
npm run dev

# Ejecutar seed (crear admin y planes)
npm run seed

# Ver logs
npm run dev | grep -i admin
```

### Dashboard

```bash
# Iniciar dashboard
cd dashboard
npm run dev

# Limpiar cache
rm -rf .next
npm run dev
```

## 🎯 Verificación

Para verificar que todo funciona:

1. ✅ Backend corriendo en http://localhost:3000
2. ✅ Dashboard corriendo en http://localhost:3001
3. ✅ Puedes iniciar sesión con admin@chatbot.com
4. ✅ Ves el enlace "Admin Panel" en el sidebar
5. ✅ Puedes acceder a /es/dashboard/admin
6. ✅ Ves las estadísticas del sistema

## 📚 Documentación Adicional

- **Guía Completa**: `ADMIN_PANEL_GUIDE.md`
- **Deployment**: `DEPLOYMENT.md`
- **Backend README**: `backend/README.md`

---

**Última actualización**: Noviembre 2024
**Estado**: ✅ Error corregido, credenciales documentadas
