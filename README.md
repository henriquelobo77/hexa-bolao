# HEXA · Bolão Copa 2026

Bolão da Copa do Mundo 2026 — web app PWA, Next.js 16 + Supabase, identidade
visual "PITCH" (preto + lima ácido). Ranking ao vivo, palpites de campeão e
artilheiro, multiplicadores (Brasil 2×, mata-mata progressivo), bônus zebra,
resumo diário pra WhatsApp.

```
A galera entra com:  https://seu-dominio.vercel.app
                     → digita código + apelido (sem login)
                     → palpita os 104 jogos
                     → vê o ranking atualizar AO VIVO
                     → recebe o resumo do dia no grupo do WhatsApp
```

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Setup do Supabase](#2-setup-do-supabase)
3. [Setup local](#3-setup-local)
4. [Sincronizar com a FIFA (API esportiva)](#4-sincronizar-com-a-fifa-api-esportiva)
5. [Deploy no Vercel](#5-deploy-no-vercel)
6. [Cron de resultados (atualização ao vivo)](#6-cron-de-resultados-atualização-ao-vivo)
7. [Resumo diário pra WhatsApp](#7-resumo-diário-pra-whatsapp)
8. [Durante a Copa — rotina do admin](#8-durante-a-copa)
9. [Estrutura do projeto](#9-estrutura-do-projeto)
10. [Engine de pontuação](#10-engine-de-pontuação)
11. [Roadmap futuro](#11-roadmap)

---

## 1. Pré-requisitos

- **Node 20+** (`node -v`)
- Conta no **[Supabase](https://supabase.com)** (free tier serve)
- Conta no **[Vercel](https://vercel.com)** (free tier serve)
- Conta na **[football-data.org](https://www.football-data.org)** (free tier serve)
- (opcional) Conta no **[cron-job.org](https://cron-job.org)** pra cron a cada 5min

---

## 2. Setup do Supabase

### 2.1 Criar projeto

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Nome: `hexa-bolao` · Region: **South America (São Paulo)** se disponível

### 2.2 Schema + migrations

No **SQL Editor**, rode na ordem:

1. [`supabase/schema.sql`](./supabase/schema.sql) — DDL principal
2. [`supabase/migrations/001_zebra_max_hits.sql`](./supabase/migrations/001_zebra_max_hits.sql)
3. [`supabase/migrations/002_matches_external_id_unique.sql`](./supabase/migrations/002_matches_external_id_unique.sql)
4. [`supabase/migrations/003_realtime.sql`](./supabase/migrations/003_realtime.sql) — habilita Realtime
5. [`supabase/migrations/004_max_members.sql`](./supabase/migrations/004_max_members.sql)

> Se for um projeto novo, basta rodar o `schema.sql` (ele já tem tudo). As
> migrations só servem pra quem já tinha o schema antigo.

### 2.3 Pegar as chaves

**Settings → API** — anote:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(NÃO exponha no client)*

---

## 3. Setup local

```bash
cp .env.example .env.local
# edite .env.local com as chaves
npm install
npm run seed   # cria bolão + 104 partidas placeholder
npm run dev    # http://localhost:3000
```

Mínimo no `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

ADMIN_PASSWORD=uma-senha-forte
BOLAO_NAME="Galera do Boteco"
BOLAO_SLUG=galera-do-boteco
BOLAO_JOIN_CODE=HEXA2026
```

Painel admin em [`/admin`](http://localhost:3000/admin) com a senha do `.env.local`.

---

## 4. Sincronizar com a FIFA (API esportiva)

O seed cria partidas placeholder. Pra puxar os 104 jogos reais com times,
datas, horários e atualizar resultados durante o torneio:

1. Registre em **[football-data.org/client/register](https://www.football-data.org/client/register)** (30s, free)
2. Token no `.env.local`:
   ```
   FOOTBALL_DATA_TOKEN=seu-token
   ```
3. Primeira sync (apaga placeholders):
   ```bash
   npm run sync -- --reset
   ```
4. Daí em diante:
   - **No painel admin**: `/admin/dashboard` → botão **Sync agora** (mais conveniente)
   - **Por linha**: `npm run sync` (upsert, mantém edições manuais)

---

## 5. Deploy no Vercel

### 5.1 Subir pro GitHub

```bash
cd C:\Dev\bolao-copa-2026
git init -b main
echo "node_modules/" > .gitignore
git add .
git commit -m "HEXA v1"
# crie o repo no github.com primeiro, depois:
git remote add origin https://github.com/SEU-USUARIO/hexa-bolao.git
git push -u origin main
```

### 5.2 Importar no Vercel

1. [vercel.com/new](https://vercel.com/new) → escolha o repo
2. **Root Directory:** `web` *(importante — o app fica em `bolao-copa-2026/web`)*
3. **Framework Preset:** Next.js
4. **Environment Variables** — copie TODOS do `.env.local`:

| Variável | Onde colar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | exata do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | exata do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | exata do Supabase |
| `ADMIN_PASSWORD` | mesma do `.env.local` |
| `FOOTBALL_DATA_TOKEN` | do football-data.org |
| `CRON_SECRET` | string aleatória de 30+ chars |

5. **Deploy**. Em ~2min sai a URL `hexa-bolao.vercel.app`.

### 5.3 Configurar Supabase Realtime no projeto deployado

No painel Supabase: **Project Settings → API → Realtime** — confirme que está
habilitado nas tabelas. A migration `003_realtime.sql` já adiciona elas no
publication, mas o toggle precisa estar ON.

### 5.4 Mandar pra galera

```
Galera, bolão da Copa tá no ar:
https://hexa-bolao.vercel.app
Código: HEXA2026
```

Cada um entra, escolhe um apelido e começa a palpitar.

---

## 6. Cron de resultados (atualização ao vivo)

Dois mecanismos rodam em paralelo:

### a) Vercel Cron — de hora em hora

Já configurado em [`vercel.json`](./vercel.json). Bate em `/api/cron/sync` (protegido por `CRON_SECRET`) e
puxa atualizações da football-data.org. Tier Hobby do Vercel suporta até 1h.

### b) cron-job.org — a cada 5min (durante a Copa)

Pra ranking realmente "ao vivo" durante os jogos, configure um cron externo:

1. Conta grátis em **[cron-job.org](https://cron-job.org)**
2. **Create cronjob**
   - URL: `https://hexa-bolao.vercel.app/api/cron/sync`
   - Schedule: **a cada 5 minutos** (`*/5 * * * *`)
   - Request headers:
     ```
     Authorization: Bearer SEU_CRON_SECRET
     ```
   - Active: ✓
3. Salve. Vai bater no endpoint a cada 5min, 24/7.

Como cada sync é 1 request na football-data.org (que dá 10/min no free),
cabe folgado com bastante margem.

### c) Realtime no browser (Supabase)

Independente do cron, quando o admin lança um resultado em `/admin/jogos`,
o **Supabase Realtime** dispara um evento WebSocket pra **todos os clientes
com a aba aberta**, e a página atualiza em ~1 segundo. Sem polling, sem
refresh manual.

---

## 7. Resumo diário pra WhatsApp

Página em [`/admin/resumo`](http://localhost:3000/admin/resumo) gera um texto
formatado com:

- Jogos do dia (com resultado)
- Top 5 pontuadores do dia (com medalhas + zebras cravadas)
- Top 5 do ranking geral

Três botões:

1. **Copiar texto** — joga no clipboard, você cola no grupo
2. **Abrir WhatsApp** — link `wa.me` com texto pré-preenchido, você escolhe o grupo
3. **Compartilhar** — usa Web Share API nativo do mobile

### Futuro: envio automático

Pra evitar copiar/colar todo dia, dá pra plugar:

- **Z-API** (~R$ 19/mês) — bridge WhatsApp Web ↔ REST
- **Evolution API** (self-hosted, free) — mesma ideia
- **WhatsApp Cloud API** (Meta, free com limites) — oficial mas precisa de aprovação

Hoje a página `/admin/resumo` já produz o texto; basta plugar o disparador.

---

## 8. Durante a Copa

| Quando | O que fazer |
|---|---|
| **Antes do 1º jogo (11/jun)** | `/admin/jogos` — conferir partidas após sync inicial |
| **Cada manhã** | Nada — cron faz tudo |
| **Após cada jogo importante** | (Opcional) `Sync agora` no admin pra antecipar |
| **Final do dia** | `/admin/resumo` → copiar texto → colar no grupo |
| **Após o final (19/jul)** | `/admin/especiais` — lançar campeão e artilheiro |

---

## 9. Estrutura do projeto

```
web/
├── app/
│   ├── page.tsx                Landing (entrar no bolão, suporta ?c=CODIGO)
│   ├── icon.tsx                Favicon dinâmico (next/og)
│   ├── apple-icon.tsx          Apple touch icon
│   ├── opengraph-image.tsx     OG image (preview no WhatsApp/Twitter)
│   ├── b/[code]/               Bolão público
│   │   ├── page.tsx            Home — próximo jogo + countdown + ranking
│   │   ├── jogos/              Lista completa + palpite inline
│   │   ├── palpites/           Histórico do membro
│   │   ├── especiais/          Palpite campeão/artilheiro
│   │   ├── ranking/            Leaderboard completo
│   │   ├── regras/             Tabela de pontuação
│   │   ├── stats/              Estatísticas pessoais vs. bolão
│   │   ├── perfil/             Trocar apelido, sair
│   │   └── convidar/           QR code + link + WhatsApp
│   ├── admin/                  Painel administrativo
│   │   ├── dashboard/          Stats + sync + export + criar bolão
│   │   ├── jogos/              Lançar resultado + editar + add/delete
│   │   ├── regras/             Configurar pontuação
│   │   ├── especiais/          Lançar campeão/artilheiro oficial
│   │   ├── membros/            Gerenciar membros
│   │   └── resumo/             Gerar resumo do dia (WhatsApp)
│   └── api/
│       ├── cron/sync           Endpoint do cron (CRON_SECRET)
│       ├── admin/export        CSV de ranking/palpites/membros
│       └── pwa-icon/[size]     Ícones dinâmicos pra manifest
├── components/                 UI compartilhados (forms, cards, etc.)
├── lib/
│   ├── supabase.ts             Clientes browser/server/admin
│   ├── queries.ts              Reads tipados
│   ├── scoring.ts              Engine pura (testável)
│   ├── recap.ts                Geração do resumo diário
│   ├── football-api.ts         Cliente football-data.org
│   ├── actions/{member,predictions,admin,sync}.ts  Server Actions
│   ├── fixtures.ts             104 partidas placeholder
│   ├── database.types.ts       Tipos do schema
│   └── types.ts                Tipos do domínio
└── supabase/
    ├── schema.sql              DDL principal
    ├── migrations/             001-004
    ├── seed.ts                 npm run seed
    └── sync.ts                 npm run sync
```

---

## 10. Engine de pontuação

Engine em [`lib/scoring.ts`](./lib/scoring.ts) — pura, sem efeitos colaterais. Pra cada palpite:

```
pontos = base × multiplicadores + bônus_zebra
```

- **Base** — depende se acertou placar exato, empate exato, vencedor+saldo, só vencedor, ou errou
- **Multiplicadores** — combinam (Brasil 2× na semi 2.5× = 5× total)
  - Brasil em campo: 2× (configurável)
  - Oitavas: 1.5× · Quartas: 2× · Semi: 2.5× · Final: 3×
- **Bônus zebra** — se cravou o placar exato e no máximo N pessoas (padrão N=1)
  acertaram o mesmo placar, ganha pontos extra

Tudo configurável em `/admin/regras` sem deploy.

---

## 11. Roadmap

Implementado nesta versão:
- [x] Web app PWA (favicon, OG image, manifest, ícones)
- [x] Entrada por código + apelido (sem login)
- [x] 104 partidas + palpite por jogo
- [x] Multiplicadores e bônus zebra configuráveis
- [x] Palpite de campeão + artilheiro (vice e semifinalistas opcionais)
- [x] Ranking ao vivo (Supabase Realtime)
- [x] Admin: lançar resultado, editar/add/deletar jogo, configurar regras
- [x] Admin: criar múltiplos bolões
- [x] Sync com football-data.org (manual + cron)
- [x] Resumo diário pra WhatsApp (copy/link wa.me)
- [x] Convite com QR code + link + WhatsApp
- [x] Histórico de palpites + estatísticas pessoais
- [x] Export CSV (ranking, palpites, membros)
- [x] Cap de membros (anti-spam básico)

Próximo (v2):
- [ ] Web Push notifications (VAPID + service worker — exige biblioteca `web-push`)
- [ ] Z-API ou Evolution API pra envio automático do resumo
- [ ] Switcher de bolão no admin (multi-bolão completo)
- [ ] Gráfico de evolução de ranking ao longo do tempo
- [ ] Convite com link expirável + token único por pessoa (anti-trapaça forte)

---

Identidade visual de referência em [`public/identidade-visual.html`](./public/identidade-visual.html)
(também servida em produção: `https://seu-dominio.vercel.app/identidade-visual.html`).

Stack: [Next.js 16](https://nextjs.org) · [Tailwind v4](https://tailwindcss.com) ·
[Supabase](https://supabase.com) · TypeScript estrito · Zod · date-fns ·
Fontes Big Shoulders / Manrope / JetBrains Mono.
