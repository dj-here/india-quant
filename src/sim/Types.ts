/**
 * Starfall Survivors — Simulation Domain Types
 * Strictly pure TypeScript: NO Phaser or browser DOM dependencies!
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type WeaponCategory = "projectile" | "beam" | "orbit" | "area" | "chain";

export interface ActiveWeapon {
  id: string;
  level: number;
  cooldownTimerMs: number;
}

export interface ActivePassive {
  id: string;
  level: number;
}

export interface PlayerSimState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  weapons: ActiveWeapon[];
  passives: ActivePassive[];
  magnetRadius: number;
  armor: number;
  mightBonus: number;
  cooldownMultiplier: number;
  areaMultiplier: number;
  critChance: number;
  critMultiplier: number;
  invulnerableTimerMs: number;
  isDead: boolean;
}

export interface EnemySimState {
  id: number;
  typeId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  xpValue: number;
  stardustDropChance: number;
  behavior: "chase" | "swarm" | "charge" | "ranged" | "splitter" | "summoner" | "boss";
  chargeCooldownMs: number;
  shootCooldownMs: number;
  isCharging?: boolean;
  tintColor: number;
}

export interface ProjectileSimState {
  id: number;
  weaponId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  pierceRemaining: number;
  durationMsRemaining: number;
  isEnemy: boolean;
  targetId?: number;
  chainRemaining?: number;
  hitEnemyIds: Set<number>;
}

export interface GemSimState {
  id: number;
  x: number;
  y: number;
  xpValue: number;
  isStardust: boolean;
  isMagnetized: boolean;
}

export interface DamageEvent {
  tick: number;
  targetType: "enemy" | "player";
  targetId: number;
  damage: number;
  isCrit: boolean;
  x: number;
  y: number;
}

export interface KillEvent {
  tick: number;
  enemyTypeId: string;
  x: number;
  y: number;
  xpValue: number;
}

export interface SimInputDelta {
  tick: number;
  dx: number; // -1, 0, or 1
  dy: number; // -1, 0, or 1
  angle?: number;
}

export interface SimRunStats {
  score: number;
  durationMs: number;
  kills: number;
  levelReached: number;
  stardustEarned: number;
  damageDealt: number;
  damageTaken: number;
  weaponsFinal: { id: string; level: number }[];
  passivesFinal: { id: string; level: number }[];
}

export interface SimState {
  tick: number;
  timeSec: number;
  seed: number;
  rngState: number;
  player: PlayerSimState;
  enemies: EnemySimState[];
  projectiles: ProjectileSimState[];
  gems: GemSimState[];
  score: number;
  kills: number;
  stardust: number;
  combo: number;
  comboTimerMs: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  pendingLevelUps: number;
  activeLevelUpChoices?: string[];
}
