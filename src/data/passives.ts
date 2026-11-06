export interface PassiveDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  statModifier: {
    cooldownReduction?: number; // percentage
    magnetRadiusBonus?: number; // percentage
    mightBonus?: number;        // percentage
    critChanceBonus?: number;   // flat
    critDamageBonus?: number;   // flat
    areaBonus?: number;         // percentage
    projSpeedBonus?: number;    // percentage
    armorBonus?: number;        // flat
    speedBonus?: number;        // percentage
    maxHpBonus?: number;        // flat
    hpRegenSec?: number;        // flat
    stardustBonus?: number;     // percentage
    rerollsBonus?: number;      // flat count
  };
  icon: string;
}

export const PASSIVES: Record<string, PassiveDef> = {
  overcharged_capacitor: {
    id: "overcharged_capacitor",
    name: "Overcharged Capacitor",
    description: "Accelerates energy regeneration, reducing weapon firing cooldowns by 8% per level.",
    maxLevel: 5,
    statModifier: { cooldownReduction: 0.08 },
    icon: "zap",
  },
  gravity_well: {
    id: "gravity_well",
    name: "Gravity Well",
    description: "Amplifies magnetic gravitational pull, increasing XP gem collection radius by 25% per level.",
    maxLevel: 5,
    statModifier: { magnetRadiusBonus: 0.25 },
    icon: "magnet",
  },
  amplifier: {
    id: "amplifier",
    name: "Amplifier",
    description: "Overclocks power emitters, increasing damage dealt by all weapons by 12% per level.",
    maxLevel: 5,
    statModifier: { mightBonus: 0.12 },
    icon: "flame",
  },
  targeting_matrix: {
    id: "targeting_matrix",
    name: "Targeting Matrix",
    description: "Enhances weapon telemetry, granting +6% critical strike chance and +30% critical damage per level.",
    maxLevel: 5,
    statModifier: { critChanceBonus: 0.06, critDamageBonus: 0.3 },
    icon: "crosshair",
  },
  high_voltage_battery: {
    id: "high_voltage_battery",
    name: "High-Voltage Battery",
    description: "Stores auxiliary energy packs, providing +10% attack rate per level.",
    maxLevel: 5,
    statModifier: { cooldownReduction: 0.1 },
    icon: "battery-charging",
  },
  prism_shard: {
    id: "prism_shard",
    name: "Prism Shard",
    description: "Refracts energy fields, expanding the area of effect and size of all attacks by 15% per level.",
    maxLevel: 5,
    statModifier: { areaBonus: 0.15 },
    icon: "sparkles",
  },
  dimensional_fold: {
    id: "dimensional_fold",
    name: "Dimensional Fold",
    description: "Bends spacetime around outgoing munitions, boosting projectile velocity by 15% and duration by 20%.",
    maxLevel: 5,
    statModifier: { projSpeedBonus: 0.15 },
    icon: "orbit",
  },
  titanium_plating: {
    id: "titanium_plating",
    name: "Titanium Plating",
    description: "Reinforces hull bulkheads, reducing incoming damage by 6 flat armor per level.",
    maxLevel: 5,
    statModifier: { armorBonus: 6 },
    icon: "shield",
  },
  warp_thruster: {
    id: "warp_thruster",
    name: "Warp Thruster",
    description: "Tunes reaction thrusters, increasing ship movement and dodge speed by 10% per level.",
    maxLevel: 5,
    statModifier: { speedBonus: 0.1 },
    icon: "wind",
  },
  nano_repair: {
    id: "nano_repair",
    name: "Nano-Repair Swarm",
    description: "Injects microscopic repair droids, boosting Max HP by +25 and regenerating +0.6 HP per second.",
    maxLevel: 5,
    statModifier: { maxHpBonus: 25, hpRegenSec: 0.6 },
    icon: "heart-pulse",
  },
  bounty_module: {
    id: "bounty_module",
    name: "Bounty Module",
    description: "Reprograms sensor telemetry to harvest +20% bonus Stardust and score per level.",
    maxLevel: 5,
    statModifier: { stardustBonus: 0.2 },
    icon: "coins",
  },
  chrono_sensor: {
    id: "chrono_sensor",
    name: "Chrono Sensor",
    description: "Calculates temporal probability branches, granting +1 upgrade reroll per rank.",
    maxLevel: 3,
    statModifier: { rerollsBonus: 1 },
    icon: "clock",
  },
};
