# Starfall Survivors — Asset Licensing & Attribution Guide (ASSET_LICENSES.md)

This document catalogs every audio, graphical, font, and code asset utilized in **Starfall Survivors**. It details licensing provenance, intellectual property verification, and procedures for audit compliance.

---

## 1. Compliance Philosophy & Zero-Copyright Risk

Starfall Survivors adheres strictly to zero-copyright-liability and open-standard asset principles:
1. **No Trademark or Character Infringement**: No copyrighted characters, licensed gaming universes, or proprietary audio trademarks.
2. **Procedural First**:
   - Visuals: Vector and HTML5 2D Canvas procedurally generated neon geometric sprites (ships, beams, drones, bosses, gems, particles). 100% custom code authored specifically for Starfall Survivors, released under MIT / CC0.
   - Audio: Procedurally synthesized SFX via ZzFX micro-synthesizer and procedural 4-stem dynamic music generated in real-time via the Web Audio API. 100% client-side code, 0 MB downloaded MP3/WAV files, 0 copyright risk.
3. **CC0 / Public Domain Backups**: Any supplementary texture atlases or icon glyphs are verified CC0 1.0 Universal (Public Domain) or MIT licensed.

---

## 2. Asset Manifest & Attribution Registry

### A. Procedural Audio Engine (SFX & Music)
- **Engine**: ZzFX (Zuper Zmall Zound Zupplier) & Web Audio API Oscillator Matrix
- **Author**: Frank Force (ZzFX) & Starfall Survivors Engineering Team
- **License**: MIT License
- **License Text / Terms**: Permitted for commercial and non-commercial games without royalty or restrictive attribution.
- **Usage**:
  - `laser_fire_01` .. `08`: High-frequency sawtooth frequency slides.
  - `explosion_heavy_01` .. `04`: Low-pass filtered noise bursts with pitch decay.
  - `gem_pickup_chime`: Ascending pentatonic bell tones with dynamic pitch scaling based on combo multiplier.
  - `boss_alert_siren`: Dual oscillating square wave warning pulse.
  - `level_up_fanfare`: 4-note resonant harmonic triad.
  - Adaptive 4-stem cosmic background music (Ambient, Bass, Arp, Drums).

### B. Procedural Visual Pipeline (Textures, Particles & Shaders)
- **Engine**: Dynamic HTML5 2D Offscreen Canvas Vector Generator (`/src/game/graphics/TextureGenerator.ts`)
- **Author**: Starfall Survivors Team
- **License**: MIT License / CC0
- **Usage**:
  - `player_vanguard`: Glowing cyan delta-wing starfighter with twin plasma thrusters.
  - `player_reaver`: Sharp obsidian stealth interceptor with violet particle trail.
  - `player_solaris`: Amber radiant battlecruiser with rotating solar halo.
  - `enemy_drone`: Red angular swarmer drone.
  - `enemy_viper`: Emerald serpentine hunter.
  - `enemy_crusher`: Heavily armored hexagonal battle platform.
  - `enemy_skimmer`: Pulsing magenta ranged hovercraft.
  - `boss_leviathan`: Multi-segmented cosmic serpent with pulsing core.
  - `boss_harbinger`: Grand triangular cosmic mothership with rotating orbital cannons.
  - `gem_xp_tier1..3`: Diamond and star-shaped glowing neon crystals.
  - `bullet_laser`, `bullet_blade`, `bullet_missile`, `bullet_lightning`: Crisp glowing geometric projectiles.

### C. UI Typography & Icons
- **Fonts**:
  - System UI font stack fallback + `Inter` / `Orbitron` Google Font (SIL Open Font License 1.1).
  - Permitted for commercial web embedding with no licensing fees.
- **Iconography**:
  - Lucide React (`lucide-react`)
  - License: ISC License
  - Terms: Copyright (c) Lucide Project. Free for commercial software.

---

## 3. License Audit Checklist

| Asset Category | Source | License Type | Commercial Use | Attribution Required | Verified Date |
|---|---|---|---|---|---|
| Texture Generator | Custom Procedural TS | MIT / Custom | Yes | No | 2026-11-05 |
| Sound Synthesizer | ZzFX + Web Audio API | MIT | Yes | Optional | 2026-11-05 |
| Adaptive Synth Stems | Web Audio Procedural | MIT / Custom | Yes | No | 2026-11-05 |
| UI Icons | Lucide React | ISC | Yes | No | 2026-11-05 |
| Font (Orbitron / Inter)| Google Fonts | OFL 1.1 | Yes | No | 2026-11-05 |
