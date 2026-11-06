export interface DailyModifierDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: {
    playerSpeedMult?: number;
    enemySpeedMult?: number;
    playerDamageMult?: number;
    enemySpawnMult?: number;
    xpDropMult?: number;
    playerHpMult?: number;
    cooldownReductionMult?: number;
  };
}

export const DAILY_MODIFIERS: DailyModifierDef[] = [
  {
    id: "hyperdrive",
    name: "Hyperdrive Overload",
    description: "Both player and enemy movement speeds are accelerated by +50%.",
    icon: "wind",
    effect: { playerSpeedMult: 1.5, enemySpeedMult: 1.5 },
  },
  {
    id: "glass_cannon",
    name: "Glass Core",
    description: "Player deals +150% damage, but maximum HP is capped at 35%.",
    icon: "flame",
    effect: { playerDamageMult: 2.5, playerHpMult: 0.35 },
  },
  {
    id: "solar_storm",
    name: "Solar Swarm Storm",
    description: "Enemy spawn rates are doubled; XP gem values are doubled.",
    icon: "zap",
    effect: { enemySpawnMult: 2.0, xpDropMult: 2.0 },
  },
  {
    id: "heavy_ordnance",
    name: "Heavy Munitions",
    description: "Weapons fire 25% slower, but deliver +100% blast damage and knockback.",
    icon: "bomb",
    effect: { playerDamageMult: 2.0, cooldownReductionMult: -0.25 },
  },
  {
    id: "stardust_frenzy",
    name: "Stardust Deluge",
    description: "Enemies drop 3x Stardust; elite enemies appear twice as often.",
    icon: "coins",
    effect: { xpDropMult: 1.25, enemySpeedMult: 1.15 },
  },
];

/** Selects 2 deterministic modifiers for a given UTC date */
export function getDailyModifiersForDate(utcDateStr: string): DailyModifierDef[] {
  let hash = 0;
  for (let i = 0; i < utcDateStr.length; i++) {
    hash = (hash << 5) - hash + utcDateStr.charCodeAt(i);
    hash |= 0;
  }
  const idx1 = Math.abs(hash) % DAILY_MODIFIERS.length;
  const idx2 = (Math.abs(hash >> 3) + 1) % DAILY_MODIFIERS.length;
  if (idx1 === idx2) {
    return [DAILY_MODIFIERS[idx1], DAILY_MODIFIERS[(idx1 + 1) % DAILY_MODIFIERS.length]];
  }
  return [DAILY_MODIFIERS[idx1], DAILY_MODIFIERS[idx2]];
}
