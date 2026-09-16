# ArchiTablox — Contexto del proyecto

## Qué es
Kanban gamificado tipo RPG. Los usuarios gestionan tarjetas, ganan XP/AP, suben de nivel y compran cosméticos (avatares, marcos, fondos, temas).

URL producción: https://archi-tablox.vercel.app
Repo: https://github.com/ArchinimeDev/ArchiTablox

## Stack
- **Next.js 15** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (con CSS vars por tema, sobrescribiendo --color-slate-*)
- **Zustand** (estado cliente con persist en localStorage)
- **Supabase** (auth Google + email, Postgres, Storage, Realtime, RPCs)
- **Resend** (envío de emails)
- **dnd-kit** (drag & drop)
- **Vercel** (deploy automático desde `main`)

## Estructura
app/
page.tsx ← tablero principal (Home)
layout.tsx ← themeInitScript anti-FLASH
components/ ← todos los componentes UI
api/send-email/ ← endpoint Resend (protegido con auth)
login/, join/[token]/, auth/callback/
store/
board.ts ← tableros, columnas, tarjetas, labels
profile.ts ← XP, AP, cosméticos equipados
stats.ts ← contadores, racha, logros
admin.ts ← isAdmin (NO persistido, evita fugas)
hooks/
useXP.ts ← procesa actividad → da XP/AP
utils/supabase/
client.ts, server.ts
lib/
cosmetics.ts, xp.ts, gamification.ts, notifications.ts, dateUtils.ts
types/index.ts ← tipos globales

## Modelo de datos (Supabase)
- Tabla `boards` → `id, user_id, name, data (JSONB con columns/cards/labels/templates/activity)`
- Tabla `board_members` → `id, board_id, user_id, role (owner|editor|viewer)`
- Tabla `board_invites` → invitaciones pendientes por email
- Tabla `share_tokens` → links compartibles
- Storage bucket `card-attachments`
- RPCs: `get_board_members`, `get_my_pending_invites`, `accept_invite_by_id`, `reject_invite_by_id`, `accept_board_token`, `create_board_invite`, `create_share_token`, `revoke_share_token`, `cancel_board_invite`, `remove_board_member`, `change_member_role`, `list_board_invites`, `list_board_tokens`

## Sync actual
- Zustand persiste en localStorage (offline-first)
- `useSyncBoards` hook: carga desde Supabase al login, guarda cambios con debounce 1.5s
- Supabase Realtime escucha cambios en `boards` para recargar
- ⚠️ Last-write-wins — conflictos no están mergeados aún

## Gamificación
- **XP**: sube nivel (curva `50 * (n-1)^2.4`, 100 niveles)
- **AP**: moneda para comprar cosméticos
- **Racha**: días consecutivos usando la app, multiplica XP (1x → 1.5x → 2x → 3x)
- **Cosméticos**: 50+ items con rarezas (common → mythic)
- **Admin** (`archinime77@gmail.com`): tiene todo desbloqueado virtualmente sin persistirlo

## Bugs conocidos / pendientes
- [x] ~~Fix seguridad endpoint email (ya cerrado con auth + rate limit)~~
- [x] ~~Fuga de cosméticos admin entre cuentas (movido a store/admin.ts)~~
- [x] ~~Stale closure en CardModal Ctrl+Enter~~
- [ ] Sync last-write-wins → pérdida de datos con multi-usuario
- [ ] JSON blob gigante en `boards.data` → sube todo cada cambio
- [ ] Polling de invites cada 30s (migrar a Realtime)
- [ ] Attachments huérfanos en Storage al borrar tarjeta
- [ ] `useXP` doble conteo en multi-pestaña
- [ ] `NotificationsPanel` con `tag` fijo machaca notificaciones
- [ ] 11 usos de `window.confirm/alert/prompt` → reemplazar por hooks propios
- [ ] 4 fetches duplicados de `get_board_members`

## Convenciones
- Idioma UI: español
- Comentarios de código: español
- Mensajes de commit: español, formato `feat:`, `fix:`, `chore:`
- Modales en móvil: pantalla completa; desktop: centrado con `max-h-[90vh]`
- Colores: amber-500 = accent, slate-900/950 = fondos, red-500 = peligro
- Todos los stores usan patrón `withActiveBoard()` para operaciones
- IDs: UUID v4 (compatible con Supabase)

## Reglas importantes
1. Nunca persistir `isAdmin` en localStorage
2. Nunca exponer `RESEND_API_KEY` al cliente
3. Endpoint `/api/send-email` requiere auth + rate limit (30/hora por usuario)
4. Los temas se aplican vía `data-theme` en `<html>` + CSS vars en globals.css
5. Estado del board en Zustand se sincroniza con debounce 1.5s a Supabase
6. Migraciones de Zustand: bump `version` y añade lógica en `migrate()`

## Estado actual (última actualización: 2026-09)
- ✅ Deploy funcionando en Vercel
- ✅ Sprint 1 completo (seguridad + bugs críticos)
- 🚧 Sprint 2 en progreso (useConfirm, caché members, cleanup attachments)
- ⏳ Sprint 3 pendiente (tablas normalizadas, realtime filtrado)