# FitPro Agenda Personal

Sistema de agenda e gestão para personal trainers — PWA (Progressive Web App).

## Tecnologias

- **React** 18 + TypeScript
- **Vite** (build tool)
- **shadcn-ui** + Tailwind CSS
- **Supabase** (banco de dados, auth, storage)
- **Stripe** (pagamentos)
- **PWA** com service worker e manifest

## Como rodar localmente

Pré-requisito: Node.js 18+ (recomendado: [nvm](https://github.com/nvm-sh/nvm))

```sh
# Clone o repositório
git clone <GIT_URL>
cd your-agenda-hub

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:8080`.

## Scripts disponíveis

```sh
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run preview    # Preview do build
npm run lint       # Verificação de lint
npm run test       # Executa os testes
```

## PWA

O app é instalável como PWA em Android, iOS e desktop. O service worker (`public/sw.js`) faz cache dos assets estáticos e suporta uso offline básico.

## Deploy

Faça o build com `npm run build` e publique a pasta `dist/` em qualquer host estático (Vercel, Netlify, Cloudflare Pages, etc.).

Lembre-se de configurar as variáveis de ambiente:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
