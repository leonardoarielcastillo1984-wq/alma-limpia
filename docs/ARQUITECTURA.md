# ALMA LIMPIA — Arquitectura técnica

## Decisión de stack

El brief propone Supabase + Cloudflare Pages. Tras evaluar, se opta por una
arquitectura **portable y self-hostable** (misma filosofía que los demás
productos LogiSmart), que corre igual en local, VPS o Docker, sin costos
fijos de servicios externos:

| Capa | Decisión | Motivo |
|---|---|---|
| Framework | **Next.js 15** (App Router + Route Handlers) | Un solo deployable: UI + API |
| Lenguaje | TypeScript estricto | — |
| Estilos | **Tailwind CSS 4** + tokens de diseño propios | Paleta cósmica como CSS vars |
| Animación | **framer-motion** | Transiciones premium, layout animations |
| DB | **PostgreSQL 16** + **Prisma 6** | Relacional, migraciones, portable |
| Auth | JWT en cookie httpOnly + modo invitado | Sin dependencia externa, portable |
| LLM | **Groq** (adaptador), fallback MOCK | Proveedor intercambiable vía `LlmProvider` |
| Pagos | **Mercado Pago** (SDK oficial v2) | Webhook idempotente, créditos + membresía |
| PWA | manifest + service worker básico | Instalable mobile-first |

### Por qué no Supabase/Cloudflare ahora
- Cloudflare Pages **no soporta** Next.js completo (Route Handlers con Node
  runtime, Prisma con engine binario, Mercado Pago SDK) sin reescribir todo a
  Workers/D1 — la portabilidad se perdería.
- Supabase cobra por proyecto y ata auth/DB a su plataforma. Con Prisma +
  Postgres en Docker tenemos lo mismo (incl. RLS a nivel de queries del
  servidor) y se puede migrar a Supabase después sin tocar el código de app.
- Si más adelante se quiere Cloudflare: la app ya está modularizada
  (`src/lib`, `src/server`), la migración es acotada.

## Estructura

```
energia/
  prisma/schema.prisma        — modelo completo (users, services, tarot, pagos...)
  prisma/seed.ts              — catálogo de servicios + cartas de tarot + prompts
  docs/                       — este archivo, ENV.md, ROADMAP.md
  src/
    app/
      (public)/               — splash, onboarding, legal
      (app)/                  — app autenticada: inicio, explorar, universo, mensajes, perfil
      (app)/explorar/[universo]/[servicio] — fichas y experiencias
      api/                    — route handlers
        auth/                 — register, login, guest, logout, me
        chat/                 — motor conversacional
        tarot/                — tiradas RNG verificable
        numerology/           — cálculos determinísticos
        astrology/            — carta natal (astronomia)
        payments/             — MP checkout + webhook
        admin/                — panel interno
    components/
      ui/                     — Button, Card, Modal, Chip…
      cosmic/                 — Starfield, MoonPhase, Particles…
      tarot/                  — Deck, Card3D, FanSpread…
      chat/                   — bubbles, typing, sugerencias
    lib/                      — utils compartidos client/server
    server/
      db.ts                   — Prisma singleton
      auth.ts                 — JWT, sesiones, guest
      llm/                    — adaptadores: groq.ts, mock.ts, provider.ts
      engine/                 — motor conversacional + prompts
      services/               — catálogo, precios, tarot-data
      payments/               — mp.ts, credits.ts
      numerology/             — pitagórica determinística
      astrology/              — cálculos astronómicos
  public/
    manifest.webmanifest      — PWA
    cards/                    — ilustraciones de tarot (placeholder SVG/licencia propia)
```

## Multi-tenant
No aplica — es B2C. El aislamiento es por `userId` en cada query del
servidor; nunca se confía en ids del cliente.

## Modo demostración
Sin `GROQ_API_KEY` / `MP_ACCESS_TOKEN`, la app corre con:
- `MockLlmProvider` — respuestas pre-escritas naturales (marcado en admin).
- Pagos en modo sandbox explícito (`ALMA_PAYMENTS_MODE=mock`) — nunca
  se activa un servicio pago sin verificación del servidor.

## Seguridad
- JWT httpOnly `alma_session` (7d), rotación en cada login.
- Rate limiting por IP+usuario en chat y pagos (tabla `rate_limit_events`).
- Webhook MP: verifica `x-signature` HMAC + `provider_event_id` UNIQUE.
- Consentimiento de memoria conversacional en `consent_records`.
- Eliminación/exportación de datos: endpoints GDPR-style en `/api/me`.

## Fases (ver ROADMAP.md para estado)
1. Fundaciones: scaffold, DB, auth, diseño base, PWA. ✅ (en curso)
2. Producto: catálogo, chat, tarot, numerología, Mi Universo.
3. Monetización: MP, créditos, membresía, /admin.
4. Avanzado: carta natal real, runas, I Ching, rituales, voz.
5. Producción: tests, hardening, deploy.
