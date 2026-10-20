# ALMA LIMPIA — Operación

## Setup

```bash
cp .env.example .env          # completar DATABASE_URL y SESSION_SECRET
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts        # 6 universos, 45 servicios, mazo Rider-Waite 78, prompts, admin
npm run dev
```

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Postgres | sí |
| `SESSION_SECRET` | JWT HS256 (≥32 chars) | sí |
| `GROQ_API_KEY` | LLM real. Si falta → `MockProvider` (respuestas demo marcadas en `ai_usage_logs`) | no |
| `GROQ_MODEL` | default `llama-3.3-70b-versatile` | no |
| `MP_ACCESS_TOKEN` | Mercado Pago | solo si `ALMA_PAYMENTS_MODE=live` |
| `MP_WEBHOOK_SECRET` | firma HMAC de webhooks MP | solo en live |
| `ALMA_PAYMENTS_MODE` | `mock` (default) \| `live` | sí |
| `ALMA_APP_URL` | URL pública para `back_urls`/`notification_url` de MP | en live |
| `ALMA_ADMIN_EMAIL` / `ALMA_ADMIN_PASSWORD` | seed del superadmin | no |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_KEY` | Web Push (`npx web-push generate-vapid-keys`) | para push real |
| `ALMA_CRON_SECRET` | protege `GET /api/push/daily?key=` | para push diario |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `ALMA_EMAIL_FROM` | emails transaccionales (bienvenida, compra, reset) | para emails reales |

## Modo demo vs producción

- **LLM**: sin `GROQ_API_KEY` → `MockProvider` (no llama servicios externos, respuestas templateadas).
- **Pagos**: `ALMA_PAYMENTS_MODE=mock` → checkout simulado en `/pagos/mock/[id]`, webhook acepta sin firma. En `live` verifica `x-signature` HMAC y consulta el estado real a MP.

### Paso a pagos reales (checklist)

1. Crear app en el [panel de desarrolladores de MP](https://www.mercadopago.com.ar/developers) → obtener `MP_ACCESS_TOKEN` (producción) y el `MP_WEBHOOK_SECRET` (se genera al registrar el webhook).
2. Configurar en el panel: webhook `POST https://<dominio>/api/pagos/webhook` con evento `payment`.
3. Setear envs: `ALMA_PAYMENTS_MODE=live`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `ALMA_APP_URL=https://<dominio>` (sin esto los `back_urls` y `notification_url` quedan mal).
4. Probar con credenciales de prueba de MP (cuenta test) antes de las de producción: checkout → pago aprobado → webhook → `Purchase APPROVED` + fulfillment.
5. Si `MP_ACCESS_TOKEN` falta aunque `ALMA_PAYMENTS_MODE=live`, el sistema cae a `mock` (defensa en `paymentsMode()`).

- El gating de servicios pagos es **server-side** siempre (`checkAccess` → 402), nunca confía en el front.

## Verificabilidad (no-inventado)

- **Tarot**: seed guardada en `TarotReading.seed`; `shuffleDeck(78, seed)` reproduce la tirada exacta (Fisher-Yates + mulberry32). Orientación por `sha256(seed:rev:pos)`.
- **Carta natal**: VSOP87B geocéntrico + precesión J2000→fecha + nutación (`src/server/astrology/natal.ts`). Ascendente/MC **solo** con hora+lugar — sin eso quedan `null` con warning explícito. Tipos de `astronomia` en `src/types/astronomia.d.ts` (la lib no trae declarations). OJO: `solar.apparentLongitude` recibe siglos T, usar `solar.apparentVSOP87(earthPlanet, jde)`; `EclipticPrecessor` recibe años julianos (2000), no JDE.
- **Numerología**: cálculo determinístico pitagórico; el LLM solo interpreta los números ya calculados.
- **Interpretaciones**: el LLM recibe las posiciones/cartas reales como contexto system — no inventa valores.

## Estructura

```
src/
  app/
    page.tsx + SplashClient.tsx   # landing/entrada (guest/register/login)
    (app)/                        # shell con Starfield + BottomNav
      inicio explorar mi-universo mensajes perfil creditos admin carta-natal
      consulta/[id]/              # chat con guía + tarot integrado
      pagos/{ok,fallo,pendiente,mock/[id]}
    api/
      auth/{register,login,guest,logout,me}
      consultas/[id]/mensajes     # motor conversacional + quota
      tarot/tirar                 # RNG verificable por seed
      numerology astrologia/carta-natal
      pagos/{checkout,webhook}    # webhook idempotente (providerEventId @unique)
      me, me/export, journal, admin/services/[id]
  server/
    llm/          # provider.ts, groq.ts, mock.ts — adaptadores intercambiables
    engine/       # consultation.ts (quota/prompts/memoria), tarot.ts (RNG)
    astrology/    # natal.ts (VSOP87), geocode.ts (tabla local MVP)
    payments/     # mercadopago.ts (mock/live, firma HMAC)
    numerology/   # pitagórica determinística
    auth.ts db.ts
  components/     # cosmic/ (Starfield, Particles, CrescentMoon), nav/, tarot/
prisma/schema.prisma + seed.ts
docs/ARQUITECTURA.md
```

## Verificado E2E

- `next build` limpio (todas las rutas compilan).
- Registro + sesión + `/api/auth/me` OK.
- Consulta `tarot-del-dia` gratis + tirada guardada + mensaje mock OK; servicio pago sin pagar → 402.
- Carta natal API: 10 posiciones, Sol Géminis 24.13° (15/6/1990 — correcto), ASC/MC con hora+lugar.
- Pago mock: checkout → webhook → 10 créditos acreditados.

## Pendientes

- Iconos PWA (`/icon-192.png`, `/icon-512.png`).
- Rate limiting real (`RateLimitEvent` existe pero no se aplica).
- Casas astrológicas (Placidus), rituales interactivos, runas/I Ching.
- Push notifications, tests automatizados, deploy.
