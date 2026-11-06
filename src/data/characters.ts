export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  description: string;
  spriteKey: string;
  baseHp: number;
  baseSpeed: number;
  startingWeaponId: string;
  startingPassiveId: string;
  statBonus: {
    mightBonus: number;
    speedBonus: number;
    magnetBonus: number;
    armorBonus: number;
    areaBonus: number;
    hpRegenSec: number;
  };
  unlockCondition: string;
}

export const CHARACTERS: Record<string, CharacterDef> = {
  vanguard: {
    id: "vanguard",
    name: "Nova Vanguard",
    title: "High-Agility Interceptor",
    description: "Equipped with rapid-fire Twin Blasters and enhanced overdrive thrusters.",
    spriteKey: "player_vanguard",
    baseHp: 100,
    baseSpeed: 210,
    startingWeaponId: "twin_blaster",
    startingPassiveId: "overcharged_capacitor",
    statBonus: {
      mightBonus: 0.1,
      speedBonus: 0.15,
      magnetBonus: 0,
      armorBonus: 0,
      areaBonus: 0,
      hpRegenSec: 0,
    },
    unlockCondition: "Unlocked by default",
  },
  reaver: {
    id: "reaver",
    name: "Void Reaver",
    title: "Cosmic Bulwark",
    description: "Surrounds itself with slicing Orbital Void Blades and dense defensive plating.",
    spriteKey: "player_reaver",
    baseHp: 130,
    baseSpeed: 185,
    startingWeaponId: "orbital_blades",
    startingPassiveId: "gravity_well",
    statBonus: {
      mightBonus: 0,
      speedBonus: 0,
      magnetBonus: 0.35,
      armorBonus: 15,
      areaBonus: 0,
      hpRegenSec: 0,
    },
    unlockCondition: "Survive 3 minutes in any arena",
  },
  solaris: {
    id: "solaris",
    name: "Solaris Priestess",
    title: "Radiant Annihilator",
    description: "Harnesses massive Solar Flare bursts and radiant healing fields.",
    spriteKey: "player_solaris",
    baseHp: 110,
    baseSpeed: 195,
    startingWeaponId: "solar_flare",
    startingPassiveId: "amplifier",
    statBonus: {
      mightBonus: 0.15,
      speedBonus: 0,
      magnetBonus: 0.1,
      armorBonus: 0,
      areaBonus: 0.25,
      hpRegenSec: 1.0,
    },
    unlockCondition: "Defeat Boss 1 (The Cosmic Leviathan)",
  },
};
