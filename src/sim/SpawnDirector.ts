import { Mulberry32 } from "./Mulberry32";
import { WAVE_INTERVALS, WaveInterval } from "../data/waves";
import { ENEMIES, EnemyDef } from "../data/enemies";
import { EnemySimState } from "./Types";

export class SpawnDirector {
  private rng: Mulberry32;
  private currentIntervalIndex: number = 0;
  private spawnBudget: number = 0;
  private nextEnemyId: number = 1;
  private bossSpawnedFlags: Set<string> = new Set();

  constructor(rng: Mulberry32) {
    this.rng = rng;
  }

  /**
   * Ticks the director forward by dt seconds, updating spawn budget and selecting enemies.
   */
  public update(
    timeSec: number,
    dt: number,
    playerLevel: number,
    playerX: number,
    playerY: number,
    arenaRadius: number = 1200
  ): EnemySimState[] {
    const spawned: EnemySimState[] = [];

    // Find current active wave interval
    while (
      this.currentIntervalIndex < WAVE_INTERVALS.length - 1 &&
      timeSec >= WAVE_INTERVALS[this.currentIntervalIndex].endSec
    ) {
      this.currentIntervalIndex++;
    }

    const interval = WAVE_INTERVALS[this.currentIntervalIndex];

    // Check boss spawn events
    if (interval.bossId && !this.bossSpawnedFlags.has(interval.bossId)) {
      this.bossSpawnedFlags.add(interval.bossId);
      const bossDef = ENEMIES[interval.bossId];
      if (bossDef) {
        spawned.push(this.createEnemy(bossDef, playerX, playerY, arenaRadius, true));
      }
    }

    // Accumulate budget based on base budget + level scaling
    const levelScaling = 1 + playerLevel * 0.035;
    this.spawnBudget += interval.budgetPerSec * levelScaling * dt;

    // While budget allows, spawn weighted enemies from allowed pool
    while (this.spawnBudget >= 1.0) {
      const enemyDef = this.pickWeightedEnemy(interval);
      if (!enemyDef) break;

      const cost = Math.max(1, enemyDef.xpValue);
      if (this.spawnBudget < cost) {
        break; // Wait for budget to accumulate
      }

      this.spawnBudget -= cost;
      spawned.push(this.createEnemy(enemyDef, playerX, playerY, arenaRadius, false));
    }

    return spawned;
  }

  private pickWeightedEnemy(interval: WaveInterval): EnemyDef | null {
    let totalWeight = 0;
    for (const item of interval.allowedEnemies) {
      totalWeight += item.weight;
    }

    let roll = this.rng.next() * totalWeight;
    for (const item of interval.allowedEnemies) {
      roll -= item.weight;
      if (roll <= 0) {
        return ENEMIES[item.enemyId] || null;
      }
    }
    return ENEMIES[interval.allowedEnemies[0].enemyId] || null;
  }

  private createEnemy(
    def: EnemyDef,
    playerX: number,
    playerY: number,
    arenaRadius: number,
    isBoss: boolean
  ): EnemySimState {
    // Spawn in a ring outside immediate camera view (distance ~450 - 650 units from player)
    const angle = this.rng.next() * Math.PI * 2;
    const distance = isBoss ? 550 : 450 + this.rng.next() * 200;

    let spawnX = playerX + Math.cos(angle) * distance;
    let spawnY = playerY + Math.sin(angle) * distance;

    // Clamp within circular arena boundary
    const distFromOrigin = Math.sqrt(spawnX * spawnX + spawnY * spawnY);
    if (distFromOrigin > arenaRadius - 50) {
      const scale = (arenaRadius - 60) / distFromOrigin;
      spawnX *= scale;
      spawnY *= scale;
    }

    return {
      id: this.nextEnemyId++,
      typeId: def.id,
      x: Math.round(spawnX),
      y: Math.round(spawnY),
      vx: 0,
      vy: 0,
      hp: def.hp,
      maxHp: def.hp,
      speed: def.speed,
      damage: def.damage,
      radius: def.radius,
      xpValue: def.xpValue,
      stardustDropChance: def.stardustDropChance,
      behavior: def.behavior,
      chargeCooldownMs: def.chargeCooldownMs || 0,
      shootCooldownMs: def.shootCooldownMs || 0,
      tintColor: def.tintColor,
    };
  }
}
