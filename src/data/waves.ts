export interface WaveInterval {
  startSec: number;
  endSec: number;
  budgetPerSec: number;
  allowedEnemies: { enemyId: string; weight: number }[];
  isBreathingRoom?: boolean;
  event?: "swarm_rush" | "elite_ambush" | "mini_boss" | "final_boss";
  bossId?: string;
}

export const WAVE_INTERVALS: WaveInterval[] = [
  // 0:00 - 0:30 (Hook Phase: Light Drones only, instant gem drop)
  {
    startSec: 0,
    endSec: 30,
    budgetPerSec: 1.5,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 1.0 },
    ],
  },
  // 0:30 - 1:00 (Introduction of Scout Vipers)
  {
    startSec: 30,
    endSec: 60,
    budgetPerSec: 2.8,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 0.65 },
      { enemyId: "scout_viper", weight: 0.35 },
    ],
  },
  // 1:00 - 1:30 (Pulse Skimmers ranged pressure)
  {
    startSec: 60,
    endSec: 90,
    budgetPerSec: 4.2,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 0.45 },
      { enemyId: "scout_viper", weight: 0.35 },
      { enemyId: "pulse_skimmer", weight: 0.2 },
    ],
    event: "swarm_rush",
  },
  // 1:30 - 2:00 (Heavy Crushers arrive)
  {
    startSec: 90,
    endSec: 120,
    budgetPerSec: 5.5,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 0.3 },
      { enemyId: "scout_viper", weight: 0.3 },
      { enemyId: "heavy_crusher", weight: 0.25 },
      { enemyId: "pulse_skimmer", weight: 0.15 },
    ],
  },
  // 2:00 - 2:15 (Breathing Room before Mini-Boss)
  {
    startSec: 120,
    endSec: 135,
    budgetPerSec: 2.0,
    isBreathingRoom: true,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 1.0 },
    ],
  },
  // 2:15 - 2:30 (Solar Chargers & Splitters)
  {
    startSec: 135,
    endSec: 150,
    budgetPerSec: 6.5,
    allowedEnemies: [
      { enemyId: "solar_charger", weight: 0.4 },
      { enemyId: "void_splitter", weight: 0.35 },
      { enemyId: "heavy_crusher", weight: 0.25 },
    ],
    event: "elite_ambush",
  },
  // 2:30 - 3:15 (Mini-Boss: The Cosmic Leviathan)
  {
    startSec: 150,
    endSec: 195,
    budgetPerSec: 3.5,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 0.7 },
      { enemyId: "pulse_skimmer", weight: 0.3 },
    ],
    event: "mini_boss",
    bossId: "boss_leviathan",
  },
  // 3:15 - 3:45 (Nebula Weavers & Phase Ghosts)
  {
    startSec: 195,
    endSec: 225,
    budgetPerSec: 8.0,
    allowedEnemies: [
      { enemyId: "nebula_weaver", weight: 0.25 },
      { enemyId: "phase_ghost", weight: 0.35 },
      { enemyId: "gravity_leech", weight: 0.2 },
      { enemyId: "scout_viper", weight: 0.2 },
    ],
  },
  // 3:45 - 4:15 (Shield Bastions & Heavy Saturation)
  {
    startSec: 225,
    endSec: 255,
    budgetPerSec: 10.0,
    allowedEnemies: [
      { enemyId: "shield_bastion", weight: 0.2 },
      { enemyId: "heavy_crusher", weight: 0.25 },
      { enemyId: "solar_charger", weight: 0.25 },
      { enemyId: "void_splitter", weight: 0.3 },
    ],
    event: "swarm_rush",
  },
  // 4:15 - 4:45 (Maximum Wave Chaos)
  {
    startSec: 255,
    endSec: 285,
    budgetPerSec: 12.5,
    allowedEnemies: [
      { enemyId: "phase_ghost", weight: 0.25 },
      { enemyId: "pulse_skimmer", weight: 0.25 },
      { enemyId: "shield_bastion", weight: 0.25 },
      { enemyId: "solar_charger", weight: 0.25 },
    ],
  },
  // 4:45 - 5:00 (Pre-Boss Calm & Siren)
  {
    startSec: 285,
    endSec: 300,
    budgetPerSec: 1.5,
    isBreathingRoom: true,
    allowedEnemies: [
      { enemyId: "drone_minor", weight: 1.0 },
    ],
  },
  // 5:00+ (Final Boss: The Starfall Harbinger)
  {
    startSec: 300,
    endSec: 600,
    budgetPerSec: 4.0,
    allowedEnemies: [
      { enemyId: "scout_viper", weight: 0.5 },
      { enemyId: "pulse_skimmer", weight: 0.5 },
    ],
    event: "final_boss",
    bossId: "boss_harbinger",
  },
];
