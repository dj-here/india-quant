export type EnemyBehavior =
  | "chase"
  | "swarm"
  | "charge"
  | "ranged"
  | "splitter"
  | "summoner"
  | "boss";

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  stardustDropChance: number;
  behavior: EnemyBehavior;
  tintColor: number;
  shootCooldownMs?: number;
  chargeCooldownMs?: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  drone_minor: {
    id: "drone_minor",
    name: "Micro Drone",
    hp: 22,
    speed: 135,
    damage: 8,
    radius: 12,
    xpValue: 1,
    stardustDropChance: 0.05,
    behavior: "swarm",
    tintColor: 0x00f0ff,
  },
  scout_viper: {
    id: "scout_viper",
    name: "Scout Viper",
    hp: 45,
    speed: 165,
    damage: 12,
    radius: 14,
    xpValue: 2,
    stardustDropChance: 0.08,
    behavior: "chase",
    tintColor: 0x06d6a0,
  },
  heavy_crusher: {
    id: "heavy_crusher",
    name: "Heavy Crusher",
    hp: 260,
    speed: 70,
    damage: 24,
    radius: 24,
    xpValue: 8,
    stardustDropChance: 0.25,
    behavior: "chase",
    tintColor: 0xff0055,
  },
  pulse_skimmer: {
    id: "pulse_skimmer",
    name: "Pulse Skimmer",
    hp: 70,
    speed: 110,
    damage: 14,
    radius: 15,
    xpValue: 4,
    stardustDropChance: 0.12,
    behavior: "ranged",
    shootCooldownMs: 2500,
    tintColor: 0xff0077,
  },
  nebula_weaver: {
    id: "nebula_weaver",
    name: "Nebula Weaver",
    hp: 150,
    speed: 85,
    damage: 12,
    radius: 18,
    xpValue: 7,
    stardustDropChance: 0.2,
    behavior: "summoner",
    shootCooldownMs: 4000,
    tintColor: 0x9d4edd,
  },
  void_splitter: {
    id: "void_splitter",
    name: "Void Splitter",
    hp: 110,
    speed: 125,
    damage: 15,
    radius: 16,
    xpValue: 5,
    stardustDropChance: 0.15,
    behavior: "splitter",
    tintColor: 0x7209b7,
  },
  solar_charger: {
    id: "solar_charger",
    name: "Solar Charger",
    hp: 130,
    speed: 90,
    damage: 22,
    radius: 17,
    xpValue: 6,
    stardustDropChance: 0.18,
    behavior: "charge",
    chargeCooldownMs: 3200,
    tintColor: 0xffb703,
  },
  phase_ghost: {
    id: "phase_ghost",
    name: "Phase Ghost",
    hp: 85,
    speed: 140,
    damage: 16,
    radius: 14,
    xpValue: 4,
    stardustDropChance: 0.12,
    behavior: "chase",
    tintColor: 0x4cc9f0,
  },
  gravity_leech: {
    id: "gravity_leech",
    name: "Gravity Leech",
    hp: 170,
    speed: 100,
    damage: 14,
    radius: 19,
    xpValue: 7,
    stardustDropChance: 0.2,
    behavior: "chase",
    tintColor: 0x4361ee,
  },
  shield_bastion: {
    id: "shield_bastion",
    name: "Shield Bastion",
    hp: 320,
    speed: 80,
    damage: 20,
    radius: 22,
    xpValue: 9,
    stardustDropChance: 0.25,
    behavior: "chase",
    tintColor: 0x3a0ca3,
  },
  boss_leviathan: {
    id: "boss_leviathan",
    name: "The Cosmic Leviathan",
    hp: 4200,
    speed: 65,
    damage: 38,
    radius: 48,
    xpValue: 150,
    stardustDropChance: 1.0,
    behavior: "boss",
    shootCooldownMs: 2000,
    tintColor: 0xff0055,
  },
  boss_harbinger: {
    id: "boss_harbinger",
    name: "The Starfall Harbinger",
    hp: 13500,
    speed: 55,
    damage: 50,
    radius: 64,
    xpValue: 500,
    stardustDropChance: 1.0,
    behavior: "boss",
    shootCooldownMs: 1400,
    tintColor: 0xffb703,
  },
};
