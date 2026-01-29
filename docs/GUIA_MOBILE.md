# 📱 GUIA DE IMPLEMENTAÇÃO MOBILE

## Opções Disponíveis

| Opção | Esforço | Custo | Resultado |
|-------|---------|-------|-----------|
| **PWA** | 🟢 1-2 dias | Grátis | App instalável via browser |
| **Capacitor** | 🟡 1-2 semanas | $25-124 | App nas lojas |
| **Tauri** | 🟡 1-2 semanas | Grátis | Desktop + Mobile (beta) |

---

# OPÇÃO 1: PWA (RECOMENDADO PARA COMEÇAR)

## O que é uma PWA?

Uma Progressive Web App permite que o jogo seja:
- ✅ Instalável no home screen (Android + iOS)
- ✅ Funcione offline (com cache)
- ✅ Tenha ícone próprio
- ✅ Abra em fullscreen (sem barra do browser)
- ✅ Receba push notifications (futuro)

## Implementação

### Passo 1: Criar manifest.json

Criar ficheiro `public/manifest.json`:

```json
{
  "name": "Língyún Dào - Path of Soaring Clouds",
  "short_name": "Língyún Dào",
  "description": "A cultivation MUD game set in ancient China",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#d4af37",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/combat.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Combat System"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile View"
    }
  ],
  "categories": ["games", "entertainment"],
  "lang": "en"
}
```

### Passo 2: Atualizar index.html

Adicionar no `<head>` do `index.html`:

```html
<!-- PWA Meta Tags -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#d4af37">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Língyún Dào">

<!-- iOS Icons -->
<link rel="apple-touch-icon" href="/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">

<!-- Splash Screens iOS (opcional) -->
<link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png" 
      media="(device-width: 320px) and (device-height: 568px)">
<link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png" 
      media="(device-width: 375px) and (device-height: 667px)">
<link rel="apple-touch-startup-image" href="/splash/splash-1242x2208.png" 
      media="(device-width: 414px) and (device-height: 736px)">

<!-- Viewport for mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

<!-- Prevent phone number detection -->
<meta name="format-detection" content="telephone=no">
```

### Passo 3: Criar Service Worker

Criar ficheiro `public/sw.js`:

```javascript
const CACHE_NAME = 'lingyundao-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/logo.png',
  '/manifest.json'
];

// Install - cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls (always fetch from network)
  if (event.request.url.includes('supabase')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
```

### Passo 4: Registar Service Worker

Em `src/main.jsx`, adicionar:

```javascript
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### Passo 5: Criar Ícones

Precisas de ícones em vários tamanhos. Usar o logo existente e redimensionar:

```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

**Ferramenta gratuita:** https://realfavicongenerator.net/

### Passo 6: Testar PWA

1. Build: `npm run build`
2. Serve: `npm run preview`
3. Abrir Chrome DevTools → Application → Manifest
4. Verificar que tudo está verde
5. Testar "Install App" no Chrome

### Passo 7: Deploy

Fazer deploy no Vercel (já configurado). 
A PWA funcionará automaticamente em HTTPS.

---

## Resultado Final

Após implementar:
- ✅ Jogadores podem instalar via "Add to Home Screen"
- ✅ App abre em fullscreen
- ✅ Ícone no home screen
- ✅ Funciona offline (assets cached)
- ✅ Zero custo de lojas
- ✅ Updates automáticos

---

# OPÇÃO 2: CAPACITOR (Para Lojas)

## Quando usar?

Quando quiseres:
- Publicar na Google Play Store
- Publicar na Apple App Store
- Acesso a APIs nativas (notificações, etc.)

## Requisitos

- Node.js (já tens)
- Android Studio (Windows/Mac/Linux)
- Xcode (apenas Mac, para iOS)
- Developer Account: $25 Google, $99/ano Apple

## Implementação

### Passo 1: Instalar Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Lingyun Dao" "com.lingyundao.game" --web-dir=dist
```

### Passo 2: Adicionar Plataformas

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios  # apenas se tiveres Mac
```

### Passo 3: Build e Sync

```bash
npm run build
npx cap sync
```

### Passo 4: Abrir em IDE

```bash
npx cap open android  # Abre Android Studio
npx cap open ios      # Abre Xcode
```

### Passo 5: Configurar

No Android Studio:
1. Configurar signing keys
2. Ajustar gradle settings
3. Build APK/AAB

### Passo 6: Publicar

1. Criar conta de developer ($25 Google)
2. Criar app listing
3. Upload AAB
4. Aguardar review

---

# COMPARAÇÃO FINAL

| Critério | PWA | Capacitor |
|----------|-----|-----------|
| Tempo | 1-2 dias | 1-2 semanas |
| Custo | Grátis | $25-124 |
| Play Store | ❌ | ✅ |
| App Store | ❌ | ✅ |
| Instalável | ✅ | ✅ |
| Offline | ✅ | ✅ |
| Updates | Instantâneo | Via loja |
| Mac necessário | Não | Sim (iOS) |
| APIs Nativas | Limitado | Completo |

---

# RECOMENDAÇÃO

## Fase 1 (Agora)
Implementar **PWA** - Zero custo, funciona imediatamente.

## Fase 2 (Quando houver audiência)
Adicionar **Capacitor** para Play Store - $25 one-time.

## Fase 3 (Quando houver revenue)
Adicionar iOS via **Capacitor** - $99/ano + Mac necessário.

---

*Documento criado em Janeiro 2026*
