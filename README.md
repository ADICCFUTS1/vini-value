# vini-bet-web — frontend de vini-value

Web de fixture y picks de vini-value. SvelteKit 2 + Svelte 5 (runes) + TypeScript,
deploy en Vercel como sitio **estático prerenderizado**: los datos los genera el
pipeline Python (`export_static.py` en el repo raíz) a `static/api/*.json` y el
navegador no consulta ninguna DB ni backend por visita.

## Comandos

```powershell
pnpm install
pnpm dev        # desarrollo (http://0.0.0.0:5173), usa el Flask local si corre
pnpm build      # build prod + prerender (adapter-vercel)
pnpm check      # svelte-check (types)
```

## Modos de API (`src/lib/api.ts`)

El modo se resuelve **en runtime**, no al importar el módulo:

| Situación | Modo | Fuente de datos |
|---|---|---|
| `VITE_API_MODE` definida | ese valor | — |
| Build prod (`PROD`) | `static` | `/api/*.json` (mismo origen) |
| Página servida por https | `static` | `/api/*.json` |
| Dev local (http) | `live` | Flask `http://<hostname>:5000` |

- Override manual en el navegador: `?api=live|static` (útil para probar el
  Flask desde el build estático).
- `VITE_STATIC_BASE`: base opcional para los JSON si se sirven de otro
  dominio/CDN (default: mismo origen). Ver `.env.example`.
- En modo static, un JSON faltante se ve como "sin datos" (con `console.warn`);
  en live, un error de API se propaga y la página muestra su estado de error.

## Rutas

- `/` y `/fixtures` → redirigen a `/fixture` (client-side; conserva query)
- `/fixture` — fixture del día. En static el "hoy" es la **fecha del export**
  (`static/api/today.json`), no el reloj del visitante. Si no hay partidos,
  botón "Ver próxima fecha" usando `dates.json`.
- `/mercados` — top 3 picks por partido, filtro de liga, `?fecha=` override
  (se sincroniza a la URL al cambiar la fecha), paginación "Cargar más".
- `/estadisticas/[id]` — detalle: scoreboard por localía real (`is_home`),
  formaciones (XI + suplentes con forma aproximada `def-med-att`), tabs
  Local/Visita, filtro por mercado, búsqueda por jugador. Las ids se
  prerenderizan vía `entries` (`src/lib/generated/game-ids.json`).
- `/lineups?game_id=` — acta simple por partido (resuelve `fwd_*` al acta real).

Arquitectura: `prerender = true` + `ssr = false` en `src/routes/+layout.ts` —
el build genera shells HTML estáticos y toda la carga de datos ocurre en el
cliente desde `/api/*.json`. Así no hay mismatch de hidratación ni datos de
build viejos, y Vercel no instancia funciones por visita.

## Datos estáticos (`static/api/`)

Generados por `python export_static.py` (repo raíz) y **commiteados** (son el
deploy: push → Vercel redeploya):

```
dates.json                 fechas con datos (ventana móvil)
today.json                 fecha del export (la usa /fixture como "hoy")
fixtures.json / fixtures-<YYYY-MM-DD>.json
picks-<YYYY-MM-DD>.json
fixture-<game_id>.json / game-<game_id>.json / lineup-<game_id>.json
```

Ventana móvil: el export borra los JSON con fecha anterior a `--keep-days`
(default 60) para que el repo no crezca indefinidamente. El historial completo
sigue en la DB local y en la API Flask.

## Deploy en Vercel

1. Push de **este** repo a GitHub (`ADICCFUTS1/vini-value`, branch `main`).
2. Importar en Vercel con **Root Directory** `svelte-football-fixture-app`.
3. Sin env vars necesarias: en prod el default es `static`. Build: `vite build`
   (adapter-vercel ya configurado).
4. Cada fecha: correr `python update_daily.py` en local → commit/push acá →
   Vercel redeploya solo. Checklist en `../README_UPDATE.md`.
