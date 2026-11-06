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
  category: "projectile" | "orbit" | "area" | "chain" | "beam";
  description: string;
  spriteKey: string;
  color: string;
  levels: WeaponLevelConfig[];
  evolution?: {
    requiredPassiveId: string;
    evolvedWeaponId: string;
    evolvedName: string;
    description: string;
  };
}

export const WEAPONS: Record<string, WeaponDef> = {
  twin_blaster: {
    id: "twin_blaster",
    name: "Twin Blaster",
    category: "projectile",
    description: "Rapidly fires twin plasma bolts forward at closest targets.",
    spriteKey: "bullet_laser",
    color: "#00f0ff",
    levels: [
      { damage: 15, cooldownMs: 600, projectilesCount: 2, speed: 450, areaMultiplier: 1.0, pierce: 1, description: "Fires twin laser bolts." },
      { damage: 20, cooldownMs: 550, projectilesCount: 2, speed: 480, areaMultiplier: 1.0, pierce: 2, description: "+5 Damage, +1 Pierce." },
      { damage: 25, cooldownMs: 480, projectilesCount: 3, speed: 500, areaMultiplier: 1.1, pierce: 2, description: "+1 Projectile, -70ms Cooldown." },
      { damage: 32, cooldownMs: 420, projectilesCount: 3, speed: 520, areaMultiplier: 1.2, pierce: 3, description: "+7 Damage, +1 Pierce." },
      { damage: 42, cooldownMs: 360, projectilesCount: 4, speed: 550, areaMultiplier: 1.3, pierce: 4, description: "+1 Projectile, Maximum Overdrive." },
    ],
    evolution: {
      requiredPassiveId: "overcharged_capacitor",
      evolvedWeaponId: "quantum_railgun",
      evolvedName: "Quantum Railgun",
      description: "Infinite screen-piercing particle beams that disintegrate entire columns of enemies.",
    },
  },
  orbital_blades: {
    id: "orbital_blades",
    name: "Orbital Blades",
    category: "orbit",
    description: "Slicing energy rings that circle your ship, cutting approaching enemies.",
    spriteKey: "bullet_blade",
    color: "#9d4edd",
    levels: [
      { damage: 12, cooldownMs: 0, projectilesCount: 2, speed: 2.5, areaMultiplier: 1.0, pierce: 999, description: "2 circling void blades." },
      { damage: 16, cooldownMs: 0, projectilesCount: 3, speed: 2.8, areaMultiplier: 1.1, pierce: 999, description: "+1 Blade, +Speed." },
      { damage: 22, cooldownMs: 0, projectilesCount: 3, speed: 3.2, areaMultiplier: 1.25, pierce: 999, description: "+6 Damage, +Radius." },
      { damage: 28, cooldownMs: 0, projectilesCount: 4, speed: 3.5, areaMultiplier: 1.35, pierce: 999, description: "+1 Blade, +Speed." },
      { damage: 36, cooldownMs: 0, projectilesCount: 5, speed: 4.0, areaMultiplier: 1.5, pierce: 999, description: "+1 Blade, Slicing storm." },
    ],
    evolution: {
      requiredPassiveId: "gravity_well",
      evolvedWeaponId: "singularity_ring",
      evolvedName: "Singularity Ring",
      description: "Continuous micro-black holes that pull enemies in and shred them continuously.",
    },
  },
  solar_flare: {
    id: "solar_flare",
    name: "Solar Flare",
    category: "area",
    description: "Detonates scorching solar explosions at random high-density enemy clusters.",
    spriteKey: "bullet_flare",
    color: "#ffb703",
    levels: [
      { damage: 30, cooldownMs: 1400, projectilesCount: 1, speed: 0, areaMultiplier: 1.0, pierce: 999, durationMs: 400, description: "Drops solar detonation." },
      { damage: 45, cooldownMs: 1300, projectilesCount: 1, speed: 0, areaMultiplier: 1.2, pierce: 999, durationMs: 400, description: "+15 Damage, +20% Area." },
      { damage: 60, cooldownMs: 1200, projectilesCount: 2, speed: 0, areaMultiplier: 1.3, pierce: 999, durationMs: 400, description: "+1 Explosion cluster." },
      { damage: 80, cooldownMs: 1100, projectilesCount: 2, speed: 0, areaMultiplier: 1.45, pierce: 999, durationMs: 400, description: "+20 Damage, +Area." },
      { damage: 110, cooldownMs: 950, projectilesCount: 3, speed: 0, areaMultiplier: 1.6, pierce: 999, durationMs: 500, description: "+1 Explosion, Cataclysmic blast." },
    ],
    evolution: {
      requiredPassiveId: "amplifier",
      evolvedWeaponId: "supernova_blast",
      evolvedName: "Supernova Blast",
      description: "Fills the screen with massive thermonuclear cosmic novas.",
    },
  },
  cosmic_swarm: {
    id: "cosmic_swarm",
    name: "Cosmic Swarm",
    category: "projectile",
    description: "Fires autonomous homing micro-missiles that seek out agile enemies.",
    spriteKey: "bullet_missile",
    color: "#06d6a0",
    levels: [
      { damage: 18, cooldownMs: 1100, projectilesCount: 2, speed: 380, areaMultiplier: 1.0, pierce: 1, description: "Fires 2 homing rockets." },
      { damage: 24, cooldownMs: 1000, projectilesCount: 3, speed: 400, areaMultiplier: 1.0, pierce: 1, description: "+1 Rocket, -100ms Cooldown." },
      { damage: 30, cooldownMs: 900, projectilesCount: 4, speed: 420, areaMultiplier: 1.1, pierce: 1, description: "+1 Rocket, +Damage." },
      { damage: 38, cooldownMs: 800, projectilesCount: 5, speed: 440, areaMultiplier: 1.2, pierce: 2, description: "+1 Rocket, +1 Pierce." },
      { damage: 50, cooldownMs: 700, projectilesCount: 6, speed: 460, areaMultiplier: 1.3, pierce: 2, description: "+1 Rocket, Swarm barrage." },
    ],
    evolution: {
      requiredPassiveId: "targeting_matrix",
      evolvedWeaponId: "meteor_salvo",
      evolvedName: "Meteor Salvo",
      description: "Launches heavy clustered orbital kinetic warheads with splash impacts.",
    },
  },
  tesla_arc: {
    id: "tesla_arc",
    name: "Tesla Arc",
    category: "chain",
    description: "Discharges high-voltage lightning arcs that leap between closely grouped foes.",
    spriteKey: "bullet_lightning",
    color: "#00f0ff",
    levels: [
      { damage: 20, cooldownMs: 1200, projectilesCount: 1, speed: 0, areaMultiplier: 1.0, pierce: 3, description: "Chains across 3 targets." },
      { damage: 28, cooldownMs: 1100, projectilesCount: 1, speed: 0, areaMultiplier: 1.1, pierce: 4, description: "+1 Chain, +Damage." },
      { damage: 38, cooldownMs: 1000, projectilesCount: 2, speed: 0, areaMultiplier: 1.2, pierce: 5, description: "+1 Concurrent Arc, +1 Chain." },
      { damage: 50, cooldownMs: 900, projectilesCount: 2, speed: 0, areaMultiplier: 1.3, pierce: 6, description: "+12 Damage, +1 Chain." },
      { damage: 68, cooldownMs: 800, projectilesCount: 3, speed: 0, areaMultiplier: 1.4, pierce: 7, description: "+1 Arc, Chain storm." },
    ],
    evolution: {
      requiredPassiveId: "high_voltage_battery",
      evolvedWeaponId: "thunderstorm_core",
      evolvedName: "Thunderstorm Core",
      description: "Continuous lightning cascades across up to 10 targets with micro-stuns.",
    },
  },
  photon_beam: {
    id: "photon_beam",
    name: "Photon Beam",
    category: "beam",
    description: "Focuses a sustained laser ray forward that constantly melts targets in its path.",
    spriteKey: "bullet_laser",
    color: "#ff0077",
    levels: [
      { damage: 8, cooldownMs: 150, projectilesCount: 1, speed: 600, areaMultiplier: 1.0, pierce: 999, description: "Continuous laser stream." },
      { damage: 12, cooldownMs: 140, projectilesCount: 1, speed: 600, areaMultiplier: 1.15, pierce: 999, description: "+4 Tick Damage, wider beam." },
      { damage: 16, cooldownMs: 130, projectilesCount: 1, speed: 650, areaMultiplier: 1.3, pierce: 999, description: "+4 Tick Damage, wider beam." },
      { damage: 22, cooldownMs: 120, projectilesCount: 1, speed: 650, areaMultiplier: 1.45, pierce: 999, description: "+6 Tick Damage." },
      { damage: 30, cooldownMs: 100, projectilesCount: 2, speed: 700, areaMultiplier: 1.6, pierce: 999, description: "Twin concentrated death beams." },
    ],
    evolution: {
      requiredPassiveId: "prism_shard",
      evolvedWeaponId: "prismatic_lance",
      evolvedName: "Prismatic Lance",
      description: "Sweeps a full 360-degree rotating prismatic beam obliterating all surrounding enemies.",
    },
  },
  stardust_mines: {
    id: "stardust_mines",
    name: "Stardust Mines",
    category: "area",
    description: "Deploys proximity cosmic charges behind you that detonate on enemy contact.",
    spriteKey: "bullet_flare",
    color: "#ffb703",
    levels: [
      { damage: 35, cooldownMs: 1500, projectilesCount: 2, speed: 0, areaMultiplier: 1.0, pierce: 999, durationMs: 6000, description: "Drops 2 proximity mines." },
      { damage: 50, cooldownMs: 1400, projectilesCount: 3, speed: 0, areaMultiplier: 1.15, pierce: 999, durationMs: 7000, description: "+1 Mine, +Damage." },
      { damage: 70, cooldownMs: 1300, projectilesCount: 3, speed: 0, areaMultiplier: 1.3, pierce: 999, durationMs: 8000, description: "+20 Damage, +Blast Radius." },
      { damage: 95, cooldownMs: 1150, projectilesCount: 4, speed: 0, areaMultiplier: 1.45, pierce: 999, durationMs: 9000, description: "+1 Mine, +Damage." },
      { damage: 130, cooldownMs: 1000, projectilesCount: 5, speed: 0, areaMultiplier: 1.6, pierce: 999, durationMs: 10000, description: "+1 Mine, Minefield saturation." },
    ],
    evolution: {
      requiredPassiveId: "dimensional_fold",
      evolvedWeaponId: "cosmic_rift",
      evolvedName: "Cosmic Rift",
      description: "Mines implode into enduring spatial rifts that vortex and slow enemies while dealing massive DPS.",
    },
  },
  pulse_shield: {
    id: "pulse_shield",
    name: "Pulse Shield",
    category: "area",
    description: "Periodically discharges an kinetic shockwave radiating outward, knocking back enemies.",
    spriteKey: "bullet_blade",
    color: "#00f0ff",
    levels: [
      { damage: 20, cooldownMs: 3000, projectilesCount: 1, speed: 0, areaMultiplier: 1.0, pierce: 999, description: "Periodic knockback shockwave." },
      { damage: 32, cooldownMs: 2700, projectilesCount: 1, speed: 0, areaMultiplier: 1.2, pierce: 999, description: "+12 Damage, +Radius, -300ms Cooldown." },
      { damage: 48, cooldownMs: 2400, projectilesCount: 1, speed: 0, areaMultiplier: 1.4, pierce: 999, description: "+16 Damage, +Knockback." },
      { damage: 68, cooldownMs: 2100, projectilesCount: 1, speed: 0, areaMultiplier: 1.6, pierce: 999, description: "+20 Damage, -300ms Cooldown." },
      { damage: 95, cooldownMs: 1700, projectilesCount: 1, speed: 0, areaMultiplier: 1.85, pierce: 999, description: "Heavy kinetic repulsion burst." },
    ],
    evolution: {
      requiredPassiveId: "titanium_plating",
      evolvedWeaponId: "aegis_cosmos",
      evolvedName: "Aegis of the Cosmos",
      description: "Persistent energy barrier that deflects hostile plasma and pulverizes contact enemies.",
    },
  },
};
