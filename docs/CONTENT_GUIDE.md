# Starfall Survivors — Content Authoring Guide (CONTENT_GUIDE.md)

This handbook explains how to add or modify characters, weapons, evolutions, passives, enemies, bosses, arenas, wave curves, and achievements in **Starfall Survivors** via purely data-driven TypeScript/JSON structures without altering core engine or simulation code.

---

## 1. Directory Structure for Content

All game content resides strictly within `/src/data/`:
```
src/data/
├── characters.ts     # Playable ship classes & passive bonuses
├── weapons.ts        # Weapons, upgrades, stats & evolution recipes
├── passives.ts       # 12 passive stat modifiers
├── enemies.ts        # Enemy stats, movement AI archetypes & bosses
├── arenas.ts         # Arenas, hazards, palettes & ambient modifiers
├── waves.ts          # Minute-by-minute spawn director budget curves
├── metaTree.ts       # Persistent Stardust progression skill tree (25 nodes)
├── achievements.ts   # 30 unlockable achievements and cosmetics
└── dailyModifiers.ts # Daily challenge mutators
```

---

## 2. Adding a New Weapon & Evolution Recipe

Weapons are defined in `src/data/weapons.ts`. Each weapon has 5 standard levels. At level 5, if the player also holds the matching passive item, the weapon transforms into its **Evolved Form** upon the next level-up chest or card choice.

### Example Weapon Definition
```typescript
export interface WeaponLevelConfig {
  damage: number;
  cooldownMs: number;
  projectilesCount: number;
  speed: number;
  areaMultiplier: number;
  pierce: number;
  durationMs?: number;
  description: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "projectile" | "beam" | "orbit" | "area" | "chain";
  baseCooldown: number;
  levels: WeaponLevelConfig[];
  evolutionRecipe?: {
    requiredPassiveId: string;
    evolvedWeaponId: string;
    description: string;
  };
}
```

---

## 3. Adding a New Enemy or Boss

Enemies are defined in `src/data/enemies.ts`:
```typescript
export type EnemyBehavior = 
  | "chase"      // Moves directly toward player
  | "swarm"      // Uses flocking separation & cohesion
  | "charge"     // Telecasts attack, then rushes in straight line
  | "ranged"     // Keeps standoff distance and shoots projectiles
  | "splitter"   // Spawns 2 child enemies upon destruction
  | "summoner"   // Periodically summons minion waves
  | "boss";      // Multi-phase scripted attack pattern

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  stardustDropChance: number;
  spriteKey: string;
  behavior: EnemyBehavior;
  radius: number;
  shootCooldownMs?: number;
  chargeCooldownMs?: number;
  tintColor: number;
}
```

---

## 4. Modifying the Spawn Director Curve

Wave progression is defined in `src/data/waves.ts`. The Spawn Director operates on a **Spawn Budget** system:
```typescript
export interface WaveInterval {
  startSec: number;
  endSec: number;
  budgetPerSec: number; // Maximum spawn points consumed per second
  allowedEnemies: { enemyId: string; weight: number }[];
  isBreathingRoom?: boolean; // Halves enemy aggression for 10-15s
  event?: "swarm_rush" | "elite_ambush" | "boss_spawn";
  bossId?: string;
}
```

---

## 5. Adding Meta-Progression Nodes

Permanent upgrades are defined in `src/data/metaTree.ts`. Each node costs persistent Stardust:
```typescript
export interface MetaNodeDef {
  id: string;
  title: string;
  description: string;
  category: "offense" | "defense" | "utility" | "special";
  maxRank: number;
  baseCost: number;
  costMultiplier: number; // cost = baseCost * (costMultiplier ^ currentRank)
  statModifier: {
    stat: "damage" | "hp" | "speed" | "cooldown" | "magnet" | "stardustBonus" | "revival";
    valuePerRank: number;
  };
  requiresNodeId?: string;
  icon: string;
}
```
