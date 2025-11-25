# Dashboard - Panel de Administración

Panel de administración web construido con Next.js 14 (App Router) para gestionar chatbots, conversaciones, integraciones y facturación.

## 🎯 Características

- **Dashboard**: Métricas de uso y actividad en tiempo real
- **Gestión de Chatbots**: Crear, editar y configurar chatbots
- **Conversaciones**: Visualizar y responder conversaciones en tiempo real
- **WhatsApp**: Configurar Cloud API y gestionar sesiones QR
- **Base de Conocimiento**: Gestionar información para respuestas contextuales
- **Facturación**: Administrar suscripción, facturas y métodos de pago
- **Configuración**: Perfil de usuario y preferencias
- **Internacionalización**: Soporte para Español (predeterminado) e Inglés

## 🏗️ Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18, TailwindCSS, shadcn/ui
- **State Management**: React Context + SWR
- **Real-time**: WebSocket
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- API Backend ejecutándose

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Configurar .env.local
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# http://localhost:3002
```

### Producción

```bash
# Build
npm run build

# Iniciar
npm start
```

## 📁 Estructura del Proyecto

```
/dashboard
  /app
    /(auth)                    # Rutas públicas
      /login
      /register
    /(dashboard)               # Rutas protegidas
      /dashboard               # Dashboard principal
      /chatbots                # Gestión de chatbots
        /[id]                  # Detalle de chatbot
      /conversations           # Lista de conversaciones
        /[id]                  # Chat en tiempo real
      /whatsapp
        /cloud                 # WhatsApp Cloud API
        /qr                    # WhatsApp QR
      /knowledge               # Bases de conocimiento
      /billing                 # Facturación
        /invoices              # Historial de facturas
        /payment-methods       # Métodos de pago
        /plans                 # Cambiar plan
      /settings                # Configuración
      layout.tsx               # Layout del dashboard
    layout.tsx                 # Layout raíz
    globals.css
  /components
    /ui                        # shadcn/ui components
    /chat                      # Componentes de chat
    /chatbot                   # Componentes de chatbot
    /dashboard                 # Componentes de dashboard
    /billing                   # Componentes de facturación
  /lib
    api.ts                     # Cliente API
    auth.ts                    # Helpers de autenticación
    websocket.ts               # Cliente WebSocket
    utils.ts                   # Utilidades
  /hooks
    use-chatbots.ts
    use-conversations.ts
    use-websocket.ts
    use-auth.ts
  /types
    index.ts
  next.config.js
  tailwind.config.js
  package.json
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm start            # Iniciar producción
npm run lint         # Ejecutar ESLint
npm run format       # Formatear con Prettier
npm run type-check   # Verificar tipos TypeScript
```

## 🔑 Variables de Entorno

```env
# URL del API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# URL del WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# URL pública del dashboard (para redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

## 🎨 Componentes UI

El proyecto usa [shadcn/ui](https://ui.shadcn.com/) para componentes:

```bash
# Agregar nuevo componente
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
```

Componentes disponibles en `/components/ui/`:
- Button, Input, Select, Textarea
- Dialog, Sheet, Popover
- Card, Table, Tabs
- Toast, Alert, Badge
- Y más...

## 🔐 Autenticación

### Flujo de Autenticación

1. Usuario ingresa credenciales en `/login`
2. Se envía request a `POST /auth/login`
3. Backend retorna JWT token
4. Token se guarda en localStorage
5. Middleware de Next.js protege rutas

### Implementación

```typescript
// hooks/use-auth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };
  
  return { user, login, logout };
}
```

### Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

## 📡 Cliente API

### Configuración

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Uso

```typescript
// Obtener chatbots
const { data } = await api.get('/chatbots');

// Crear chatbot
const { data } = await api.post('/chatbots', {
  name: 'Mi Chatbot',
  aiProvider: 'openai',
  aiModel: 'gpt-4',
});
```

## 🔄 State Management

### SWR para Data Fetching

```typescript
// hooks/use-chatbots.ts
import useSWR from 'swr';
import api from '@/lib/api';

export function useChatbots() {
  const { data, error, mutate } = useSWR('/chatbots', async (url) => {
    const response = await api.get(url);
    return response.data;
  });
  
  return {
    chatbots: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

### React Context para Estado Global

```typescript
// contexts/auth-context.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 🔌 WebSocket

### Conexión

```typescript
// hooks/use-websocket.ts
export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Manejar mensaje
    };
    
    setSocket(ws);
    
    return () => ws.close();
  }, []);
  
  return socket;
}
```

### Uso en Componentes

```typescript
// components/chat/chat-window.tsx
export function ChatWindow({ conversationId }: Props) {
  const socket = useWebSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    };
  }, [socket, conversationId]);
  
  return (
    <div>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

## 📊 Gráficos y Métricas

### Recharts

```typescript
// components/dashboard/usage-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function UsageChart({ data }: Props) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="messages" stroke="#3B82F6" />
    </LineChart>
  );
}
```

## 🎨 Theming

### Configuración de Colores

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
    },
  },
};
```

### Dark Mode

```typescript
// app/layout.tsx
export default function RootLayout({ children }: Props) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
```

## 📱 Responsive Design

Todos los componentes son responsive:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e con Playwright
npm run test:e2e
```

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build
docker build -t dashboard .

# Run
docker run -p 3002:3002 dashboard
```

### Variables de Entorno en Producción

Configurar en Vercel o en tu plataforma:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_APP_URL`

## 🔒 Seguridad

### Protección de Rutas

```typescript
// middleware.ts
export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### Sanitización de Inputs

```typescript
import DOMPurify from 'isomorphic-dompurify';

const clean = DOMPurify.sanitize(userInput);
```

### CSRF Protection

Next.js incluye protección CSRF por defecto en API Routes.

## 🌍 Internacionalización (i18n)

El dashboard soporta múltiples idiomas usando next-intl. Para información detallada sobre cómo trabajar con traducciones:

**📖 [Ver Guía Completa de i18n](./I18N_GUIDE.md)**

### Inicio Rápido

```typescript
// Usar traducciones en componentes
import { useTranslations } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('mySection')
  return <h1>{t('title')}</h1>
}
```

### Idiomas Disponibles

- 🇪🇸 Español (predeterminado)
- 🇺🇸 English

### Archivos de Traducción

- `messages/es.json` - Traducciones en español
- `messages/en.json` - Traducciones en inglés

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [SWR](https://swr.vercel.app/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

## 🤝 Contribuir

1. Seguir convenciones de Next.js
2. Usar componentes de shadcn/ui cuando sea posible
3. Mantener componentes pequeños y reutilizables
4. Escribir tests para componentes críticos

## 📞 Soporte

Para problemas con el dashboard, crear un issue en GitHub.
