# Progressive Web App (PWA) - MobiMap

Este documento descreve como usar a feature de Progressive Web App do MobiMap para fazer download e instalar o site no seu dispositivo móvel.

## 📱 O que foi adicionado

### 1. **Favicon e Ícones**
- Arquivo SVG responsivo que funciona como favicon para navegador e ícone do app
- Suporte para diferentes tamanhos de tela (192x192px e 512x512px)
- Suporte para ícones maskable (notches em dispositivos modernos)

### 2. **Manifest JSON**
- `public/manifest.json` - Define metadados do app PWA
- Inclui nome da app, descrição, ícones, cores de tema
- Suporte para shortcuts (atalhos na tela inicial)
- Configurado para funcionar em modo standalone

### 3. **Service Worker**
- `public/service-worker.js` - Permite funcionamento offline
- Estratégia de cache: Cache First para assets, Network First para API
- Sincronização automática quando a conexão é restaurada
- Atualização automática de cache

### 4. **Responsividade Mobile**
- `src/styles/mobile.css` - Estilos otimizados para mobile
- Suporte para notches e safe areas
- Touch targets com 44x44px (padrão de acessibilidade)
- Prevenção de zoom ao tocar e bounce scroll

### 5. **PWA Install Prompt**
- `src/app/hooks/usePWAInstall.ts` - Hook para detectar possibilidade de instalação
- `src/app/components/PWAInstallPrompt.tsx` - Componente de notificação visual
- Detecção automática de instalação

## 📥 Como instalar no Android

### Via Chrome/Edge/Samsung Internet:
1. Abra o MobiMap no navegador: `https://seu-dominio.com/mobimap/`
2. Aguarde a notificação de "Instalar MobiMap" (canto inferior direito)
3. Clique em "Instalar"
4. Confirme a instalação
5. O app aparecerá na tela inicial como um ícone nativo

### Menu Alternativo:
1. Toque os 3 pontos (menu) do navegador
2. Selecione "Instalar app" ou "Adicionar à tela inicial"
3. Confirme

## 📱 Como instalar no iPhone/iPad

### Modo Standalone (recomendado):
1. Abra o MobiMap no Safari
2. Toque o ícone de Compartilhar (caixa com seta)
3. Rolle para encontrar "Adicionar à Tela Inicial"
4. Toque "Adicionar"
5. O app funcionará em modo full-screen sem barra do navegador

**Nota:** iOS não suporta instalação como PWA padrão, mas aceita como "Web App". A experiência é semelhante.

## 🔄 Atualizações Automáticas

O Service Worker verifica automaticamente por atualizações:
- **Assets estáticos**: Cached e servidos do cache (mais rápido)
- **API calls**: Tenta rede primeiro, fallback para cache se offline
- **Verificação**: Acontece automaticamente ao abrir o app

## 🌐 Modo Offline

Com o Service Worker instalado:
- O app carrega localmente mesmo sem internet
- As APIs não responderão, mas a interface funcionará
- Dados em cache estarão disponíveis
- Sincronização automática quando conexão retorna

## 🎨 Personalização

### Mudar Cor do Tema:
Edite `public/manifest.json`:
```json
"theme_color": "#10b981"
```

### Mudar Favicon/Ícone:
Substitua `public/favicon.svg` por seu ícone

### Mudar Nome do App:
```json
"name": "Novo Nome",
"short_name": "Novo"
```

## 🧪 Testes

### Testar no Chrome DevTools:
1. Abra DevTools (F12)
2. Vá para Application → Service Workers
3. Veja "Service Worker registrado"
4. Na aba Manifest, confirme o manifest.json

### Testar Offline:
1. DevTools → Network
2. Marque "Offline"
3. Recarregue a página
4. O app deve continuar funcionando

### Testar no Celular Real:
1. Use `npm run build` para build de produção
2. Acesse via HTTPS (necessário para PWA)
3. O banner de instalação deve aparecer

## 📋 Checklist de Funcionalidades

- ✅ Favicon responsivo
- ✅ Manifest.json configurado
- ✅ Service Worker para cache e offline
- ✅ Responsividade mobile otimizada
- ✅ Safe areas para notches
- ✅ Touch targets acessíveis (44x44px)
- ✅ PWA Install Prompt com UI customizada
- ✅ Detecção de instalação
- ✅ Sincronização de API em background

## 📚 Recursos Adicionais

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)
- [Web.dev - Service Workers](https://web.dev/service-workers-cache-storage/)

## ⚠️ Requisitos para Produção

Para que a PWA funcione em produção:

1. **HTTPS obrigatório** - PWA só funciona com HTTPS (exceção: localhost)
2. **CORS configurado** - Para API calls via Service Worker
3. **Headers corretos**:
   ```
   Cache-Control: max-age=31536000 (assets versionados)
   Service-Worker-Allowed: /mobimap/
   ```

## 🐛 Troubleshooting

### "Install prompt não aparece"
- Espere alguns segundos após carregar o site
- Verifique se está em HTTPS (necessário)
- Limpe cache do navegador

### "Service Worker não registra"
- Verifique console (F12) por erros
- Confirme que `/mobimap/service-worker.js` está acessível
- Limpe cache: DevTools → Application → Storage → Clear site data

### "API não funciona offline"
- É esperado - offline mostra interface mas sem dados
- Dados já carregados permanecem em cache

---

Desenvolvido com ❤️ para MobiMap
