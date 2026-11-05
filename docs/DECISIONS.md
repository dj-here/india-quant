# Starfall Survivors — Architecture & System Decisions Log (DECISIONS.md)

This document records the architectural, algorithmic, gameplay, and infrastructure decisions for **Starfall Survivors**, a high-polish 2D cosmic arcade survivor game built with Next.js, Phaser 3, TypeScript, Neon Serverless PostgreSQL, Drizzle ORM, and Vercel.

---

## Decision Status Summary

| ID | Title | Status | Date | Area |
|---|---|---|---|---|
| ADR-001 | Single Next.js App Router Structure & Boundary Isolation | Accepted | 2026-11-05 | Architecture |
| ADR-002 | Headless Deterministic Simulation Core (`/src/sim`) & Replay Verification | Accepted | 2026-11-05 | Gameplay / Anti-Cheat |
| ADR-003 | Phaser 3 Client-Only Game Engine with React UI Overlay Bridge | Accepted | 2026-11-05 | Frontend / Game Engine |
| ADR-004 | Procedural Vector/Canvas Texture Pipeline & ZzFX/Web Audio Music | Accepted | 2026-11-05 | Assets & Performance |
| ADR-005 | Neon Postgres with Drizzle ORM (Pooled Runtime + Direct Migrations) | Accepted | 2026-11-05 | Backend & Database |
| ADR-006 | Guest-First LocalStorage Save with Seamless Nickname Cloud Sync | Accepted | 2026-11-05 | State Management |
| ADR-007 | Anti-Cheat: Plausibility Envelope & Headless Simulation Replay | Accepted | 2026-11-05 | Security & Fair Play |
| ADR-008 | Object Pooling, Adaptive 60 FPS Target & Mobile Touch Ergonomics | Accepted | 2026-11-05 | Performance & Mobile |
| ADR-009 | Daily Challenge Determinism (UTC Date Hash) & Modifiers Rotation | Accepted | 2026-11-05 | Gameplay Systems |
| ADR-010 | Zero-Dark-Pattern Ethics, Privacy & WCAG 2.1 AA Accessibility | Accepted | 2026-11-05 | Ethics & Accessibility |

---

## ADR-001: Single Next.js App Router Structure & Boundary Isolation

### Context
Starfall Survivors requires high-performance 2D canvas rendering (Phaser 3), reactive and accessible UI components (HUD, upgrade cards, leaderboards, settings), deterministic headless game logic for balance testing and anti-cheat replay, and serverless API endpoints backed by Neon PostgreSQL.
A monorepo setup introduces unnecessary toolchain overhead and pnpm workspace symlink complications on Vercel deployments.

### Decision
We structure the project as a single Next.js (App Router) application with strict boundary isolation:
1. `/src/sim`: Pure TypeScript deterministic game simulation core. **Strict zero-dependency on Phaser or DOM APIs**. Fully testable in Node/Vitest and executable both in-browser and headless on server/bots.
2. `/src/game`: Phaser 3 scenes, canvas managers, renderers, sprite textures, particles, camera effects, audio triggers, and input adapters. Loaded client-side only via dynamic imports (`ssr: false`).
3. `/src/data`: Balancing configs, character definitions, weapon evolutions, passive upgrades, enemy archetypes, wave director budgets, meta-progression tree, and achievements in typed JSON/TS.
4. `/src/app`: Next.js App Router pages, React HUD, modals (Level-Up, Pause, Game Over, Meta Upgrades, Leaderboard), and API route handlers (`/api/player`, `/api/save`, `/api/daily`, `/api/runs`, `/api/leaderboard`, `/api/report`, `/api/og`).
5. `/src/db`: Drizzle ORM schema, migrations, connection client, and query helpers.
6. `/src/lib`: Typed event bus (`EventBus.ts`), guest storage manager, audio engine, rate limiter.
7. `/scripts`: Automated headless balance simulator (`simulate.ts`) and database seeders.

### Consequences
- **Positive**: Clean imports, fast build times, easy deployment on Vercel, frictionless sharing of game types and verification logic between client and server.
- **Negative**: Strict discipline required to prevent Phaser or browser DOM types from leaking into `/src/sim`. Enforced via ESLint boundary rules and CI typecheck.

---

## ADR-002: Headless Deterministic Simulation Core (`/src/sim`) & Replay Verification

### Context
Survivor games rely on escalating enemy counts, precise collision detection, and weapon fire cadences. Without determinism, runs cannot be validated, replays cannot be stored compactly, and headless balance bots cannot evaluate true gameplay conditions.

### Decision
1. **Seeded PRNG**: All stochastic logic (spawn positions, upgrade rolls, enemy variant selection, critical hits) derives from a fast, 32-bit deterministic Mulberry32 generator.
2. **Fixed Timestep**: Simulation logic updates at a fixed 60 ticks per second (16.666 ms tick delta), decoupled from monitor refresh rates (60Hz, 120Hz, 144Hz, or variable mobile displays).
3. **Delta-Encoded Input Log**: Player movement inputs (angle, velocity magnitude, active directional state) are logged upon change with the corresponding simulation tick number.
4. **Replay Re-simulation**: A complete 5-minute run produces an input log of only ~5–15 KB compressed. The server or headless bot can re-run the exact simulation given `(seed, character, arena, input_log)` to verify the exact final score, kills, level, and survival duration.

### Consequences
- **Positive**: Perfect reproducibility for anti-cheat verification, automated balance benchmarking, zero client-server desync, and compact run summaries.
- **Negative**: Floating point mathematical differences across JS engines (V8 vs JavaScriptCore) must be mitigated by rounding coordinates and damage values to fixed decimal precisions.

---

## ADR-003: Phaser 3 Client-Only Game Engine with React UI Overlay Bridge

### Context
While Phaser 3 is unmatched for 2D sprite rendering, collision quad-trees, particle emitters, and camera shake, its DOM and UI toolsets are cumbersome compared to modern React and Tailwind. Conversely, React is too slow for 60 FPS per-frame sprite updates.

### Decision
We partition presentation responsibilities:
- **Phaser 3**: Canvas rendering, sprite animations, projectile pools, physics overlap checks, background parallax, particle systems, floating damage numbers, hitstop, and camera shake.
- **React (Tailwind + Framer Motion)**: HUD overlays (HP bar, XP progress bar, timer, kill counter, active weapon icons), interactive modals (3-choice upgrade card picker, pause menu, death summary, meta-tree shop, leaderboard tables).
- **Communication Bridge (`EventBus.ts`)**: A strictly typed Event Emitter connects the two layers:
  - Game -> React: `PLAYER_HP_CHANGED`, `XP_UPDATED`, `LEVEL_UP` (triggers upgrade modal), `BOSS_SPAWNED`, `PLAYER_DIED`, `GAME_WON`, `COMBO_UPDATED`.
  - React -> Game: `UPGRADE_SELECTED`, `RESUME_GAME`, `PAUSE_GAME`, `RESTART_GAME`, `SET_AUDIO_VOLUME`, `TOGGLE_AUTO_AIM`.

### Consequences
- **Positive**: Best-of-both-worlds architecture. Instant reactive UI with full keyboard/screen-reader accessibility, combined with hardware-accelerated WebGL 60 FPS rendering.
- **Negative**: Requires event synchronization discipline. Game loop must pause simulation updates when a blocking modal (e.g., Level-Up picker) is active.

---

## ADR-004: Procedural Vector/Canvas Texture Pipeline & ZzFX/Web Audio Music

### Context
Traditional sprite assets and uncompressed audio bloat bundle sizes, increase initial load times beyond the 4-second budget on mobile 4G, and introduce third-party licensing ambiguities.

### Decision
1. **Procedural Neon Graphics**:
   - High-fidelity textures for player ships, weapons, projectiles, enemy drones, XP gems, and bosses are generated at runtime onto cached off-screen HTML5 canvases using geometric neon vector routines with cyan/magenta/amber glows and bloom effects.
   - Textures are crisp at all DPIs (Retina 2x/3x scale), load in < 50 milliseconds, and result in **0 external image HTTP requests** for core gameplay.
   - Supplemental CC0 Kenney space assets are used as optional spritesheet themes, verified and documented in `/docs/ASSET_LICENSES.md`.
2. **Procedural Audio (ZzFX + Web Audio Synth)**:
   - SFX: Built-in ZzFX micro-synthesizer generating 40+ distinct sound effects (blasters, laser beams, railgun hums, explosive crunches, gem chimes, level-up fanfare, boss warnings, hit-stops) with dynamic pitch scaling.
   - Adaptive Music: Web Audio API multi-stem cosmic synth engine comprising 4 dynamic stems (Ambient Space Pad, Cosmic Bass Pulse, Fast Cyber Arpeggiator, and Heavy Driving Drums). Stems fade in smoothly as wave intensity rises from minute 1 to the minute 5 boss confrontation.

### Consequences
- **Positive**: Total game bundle size < 250 KB gzipped. Time-to-first-playable < 2 seconds on 4G. 100% CC0/MIT clean intellectual property.
- **Negative**: Procedural canvas generation requires initial warm-up on boot (takes ~30ms during preload scene).

---

## ADR-005: Neon Postgres with Drizzle ORM (Pooled Runtime + Direct Migrations)

### Context
Starfall Survivors requires persistent global leaderboards, daily challenge seeds, player profiles, and telemetry. Vercel runs stateless serverless functions, which can exhaust PostgreSQL connection limits under traffic spikes. Furthermore, Neon compute instances auto-suspend when inactive.

### Decision
1. **Drizzle ORM**: Type-safe, ultra-lightweight SQL query builder with zero runtime overhead.
2. **Dual Connection Strings**:
   - `DATABASE_URL` (Runtime): Uses Neon's connection pooler (`-pooler` host) via `@neondatabase/serverless` over WebSockets/HTTPS with connection reuse.
   - `DATABASE_URL_UNPOOLED` (Migrations & CI): Uses Neon direct connection for `drizzle-kit push` / `drizzle-kit migrate`.
3. **Cold Start & Resilience Policy**:
   - API endpoints wrap database queries with automatic retry (2 attempts with exponential backoff) to transparently absorb Neon compute wake-up latency (~1-2 seconds).
   - If database remains unreachable or user is offline, the client continues in offline mode and queues run submissions in IndexedDB for background synchronization.

### Consequences
- **Positive**: Infinite scaling on serverless, zero connection exhaustion, preview deployment branch isolation, full offline resilience.
- **Negative**: Migration tooling requires separate unpooled connection configuration.

---

## ADR-006: Guest-First LocalStorage Save with Seamless Nickname Cloud Sync

### Context
Forcing sign-up or authentication before playing ruins the "instant play in < 5 seconds" promise. Players must be able to click "Play" immediately and retain progress.

### Decision
1. **Primary Guest Storage**: All run histories, meta-progression Stardust, character unlocks, and settings persist locally in `localStorage` / `IndexedDB`.
2. **Anonymous Cryptographic Token**: On first visit, a lightweight anonymous player UUID is generated and signed with HMAC in an httpOnly cookie.
3. **Cloud Sync on Nickname Claim**: When the player decides to enter a nickname for the leaderboard, their local save is linked to their Neon database record.
4. **Data Ownership**: A "Clear All Data" and "Export Save" button in Settings gives users total autonomy over their data, complying with DPDP and GDPR data minimization.

### Consequences
- **Positive**: Zero barriers to entry; 100% playable offline or in airplane mode; seamless transition from guest to competitive leaderboard player.
- **Negative**: Clearing browser cookies/cache as an anonymous guest clears progress unless synced with a nickname. Clearly communicated via in-game tooltip.

---

## ADR-007: Anti-Cheat: Plausibility Envelope & Headless Simulation Replay

### Context
Client-side web games are vulnerable to memory modification, modified JavaScript bundles, and spoofed HTTP requests submitting impossible high scores.

### Decision
A pragmatic, serverless-friendly three-layer defense:
1. **Plausibility Envelope**: Incoming run submissions (`/api/runs`) undergo fast statutory checks:
   - Survival duration vs game timer match.
   - Max theoretical DPS calculation: kills * avg enemy HP cannot exceed maximum possible weapon damage for the submitted build.
   - Level reached must match XP required for submitted upgrade count.
   - Client version hash must match current production release.
2. **Input Log Hash & Signature**: Submissions include a compact delta-encoded input log and HMAC digest signed by the session token.
3. **Headless Re-Simulation**: Top 10 leaderboard submissions and flagged suspect runs are queued for headless re-simulation using the identical pure TypeScript simulation engine (`/src/sim`). If the simulated outcome deviates beyond acceptable tolerance, the run is flagged as unverified and excluded from public boards.

### Consequences
- **Positive**: Protects leaderboard integrity without requiring expensive authoritative dedicated game servers.
- **Negative**: Highly sophisticated bots playing at human speeds could potentially pass plausibility checks; addressed by public reporting tools and admin moderation flags.

---

## ADR-008: Object Pooling, Adaptive 60 FPS Target & Mobile Touch Ergonomics

### Context
Spawning hundreds of enemies, bullets, gems, and floating text instances per second causes frequent JavaScript garbage collection pauses, leading to frame drops ("jank") on mobile devices.

### Decision
1. **Object Pooling**: Pre-allocated pools for:
   - Projectiles (500 instances)
   - Enemies (300 instances)
   - XP Gems & Stardust (400 instances)
   - Floating Damage Numbers (150 instances)
   - Particle Bursts (300 instances)
   Zero heap allocations during the active game update loop.
2. **Adaptive Quality Controller**:
   - The game continuously samples rolling frame times over 60 frames.
   - If average FPS drops below 50 for > 2 seconds, particle caps are dynamically halved, screen shake intensity is reduced, and background nebula shader passes are simplified.
3. **Mobile Touch Ergonomics**:
   - Dynamic floating virtual joystick on the left half of the screen (appears wherever the left thumb touches).
   - Optional Auto-Aim assist enabled by default on touch viewports (aims at closest high-threat target).
   - Safe-area inset handling (`viewport-fit=cover`) for iPhone notches and Android navigation bars.

### Consequences
- **Positive**: Consistent 60 FPS on low-to-mid range mobile hardware; zero GC stutter; effortless one-thumb mobile playability.
- **Negative**: Pool management requires disciplined entity reset routines on spawn/despawn.

---

## ADR-009: Daily Challenge Determinism (UTC Date Hash) & Modifiers Rotation

### Context
A core driver of player retention is a shared daily competition where all players face the exact same arena, enemy sequence, and gameplay twist.

### Decision
1. **Daily Seed Generation**: The daily seed is computed deterministically from `hash("starfall-daily-" + YYYY-MM-DD)`.
2. **Rotating Modifiers**: Each day pairs two modifiers from a data-driven pool:
   - *Hyperdrive*: +50% player and enemy movement speed.
   - *Glass Reactor*: +200% player damage, but player HP capped at 25%.
   - *Solar Storm*: 2x enemy spawn frequency, 2x XP gem values.
   - *Heavy Ordnance*: -30% attack speed, +150% area of effect and knockback.
   - *Void Magnet*: XP gems naturally drift toward player; no health drops.
3. **One Ranked Attempt**: Players get 1 official ranked submission per UTC day to prevent grinding until lucky. Unlimited unranked "Practice Runs" are permitted.

### Consequences
- **Positive**: Daily viral replayability, community discussion, and fair competition.
- **Negative**: Timezone coordination requires strict adherence to UTC midnight resets.

---

## ADR-010: Zero-Dark-Pattern Ethics, Privacy & WCAG 2.1 AA Accessibility

### Context
Modern web gaming is plagued by predatory monetization, forced ads, cookie walls, and accessibility barriers for players with disabilities.

### Decision
1. **Ethics**:
   - No advertisements, no pay-to-win, no loot boxes, no countdown timers blocking play.
   - No manipulative push notifications or forced social sharing.
2. **Privacy**:
   - Zero third-party ad trackers.
   - Anonymous nicknames only (sanitized by profanity filter). No email or password required to compete.
3. **Accessibility**:
   - **Photosensitivity**: Flashes are strictly clamped below 3 Hz; "Reduced Flash" and "Reduced Motion" toggles in Settings disable screen shake and white hit flashes.
   - **Color-Blind Modes**: High-contrast, Protanopia, Deuteranopia, and Tritanopia color palettes for enemy hazards and XP pickups.
   - **Input Flexibility**: Full keyboard (WASD / Arrows), Gamepad (Standard API), and Touch controls with customizable sensitivity and rebinding.

### Consequences
- **Positive**: Universally accessible, ethical, privacy-respecting title suitable for all ages and regulatory compliance worldwide.
- **Negative**: Zero ad revenue model; success measured purely on player engagement, retention, and community enjoyment.
