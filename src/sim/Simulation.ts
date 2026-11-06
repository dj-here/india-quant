import { Mulberry32 } from "./Mulberry32";
import { CombatMath } from "./Combat";
import { SpawnDirector } from "./SpawnDirector";
import { InputLogger } from "./InputLogger";
import { CHARACTERS } from "../data/characters";
import { WEAPONS, WeaponDef } from "../data/weapons";
import { PASSIVES } from "../data/passives";
import {
  SimState,
  PlayerSimState,
  EnemySimState,
  ProjectileSimState,
  GemSimState,
  DamageEvent,
  KillEvent,
  SimRunStats,
} from "./Types";

export interface SimulationEvents {
  onDamage?: (event: DamageEvent) => void;
  onKill?: (event: KillEvent) => void;
  onLevelUp?: (level: number, choices: string[]) => void;
  onGameOver?: (stats: SimRunStats, isVictory: boolean) => void;
  onBossSpawned?: (bossId: string) => void;
}

export class Simulation {
  public state: SimState;
  public rng: Mulberry32;
  public spawnDirector: SpawnDirector;
  public inputLogger: InputLogger;
  public events: SimulationEvents = {};

  private nextProjId: number = 1;
  private nextGemId: number = 1;
  private arenaRadius: number = 1200;
  private totalDamageDealt: number = 0;
  private totalDamageTaken: number = 0;

  constructor(
    seed: number,
    characterId: string = "vanguard",
    arenaId: string = "neon_orbit"
  ) {
    this.rng = new Mulberry32(seed);
    this.spawnDirector = new SpawnDirector(this.rng);
    this.inputLogger = new InputLogger();

    const charDef = CHARACTERS[characterId] || CHARACTERS.vanguard;

    const initialPlayer: PlayerSimState = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: charDef.baseHp,
      maxHp: charDef.baseHp,
      speed: charDef.baseSpeed * (1 + charDef.statBonus.speedBonus),
      level: 1,
      currentXp: 0,
      nextLevelXp: CombatMath.calculateXpForNextLevel(1),
      weapons: [
        { id: charDef.startingWeaponId, level: 1, cooldownTimerMs: 0 },
      ],
      passives: [
        { id: charDef.startingPassiveId, level: 1 },
      ],
      magnetRadius: 100 * (1 + charDef.statBonus.magnetBonus),
      armor: charDef.statBonus.armorBonus,
      mightBonus: charDef.statBonus.mightBonus,
      cooldownMultiplier: 1.0,
      areaMultiplier: 1.0 + charDef.statBonus.areaBonus,
      critChance: 0.05,
      critMultiplier: 1.5,
      invulnerableTimerMs: 0,
      isDead: false,
    };

    this.state = {
      tick: 0,
      timeSec: 0,
      seed,
      rngState: this.rng.getState(),
      player: initialPlayer,
      enemies: [],
      projectiles: [],
      gems: [],
      score: 0,
      kills: 0,
      stardust: 0,
      combo: 0,
      comboTimerMs: 0,
      isPaused: false,
      isGameOver: false,
      isVictory: false,
      pendingLevelUps: 0,
    };

    // Apply starting passive stats
    this.recalculatePlayerStats();
  }

  /**
   * Advances the simulation by 1 fixed tick (default 16.666ms / 60Hz).
   */
  public tick(dx: number, dy: number, dt: number = 1 / 60): void {
    if (this.state.isGameOver || this.state.isPaused) return;

    this.state.tick++;
    this.state.timeSec += dt;
    const dtMs = dt * 1000;

    // Record movement delta
    this.inputLogger.recordInput(this.state.tick, dx, dy);

    // 1. Update Player Movement
    this.updatePlayerMovement(dx, dy, dt);

    // 2. Update Timers (Invulnerability & Combo)
    if (this.state.player.invulnerableTimerMs > 0) {
      this.state.player.invulnerableTimerMs -= dtMs;
    }
    if (this.state.comboTimerMs > 0) {
      this.state.comboTimerMs -= dtMs;
      if (this.state.comboTimerMs <= 0) {
        this.state.combo = 0;
      }
    }

    // 3. Spawn Director
    const newEnemies = this.spawnDirector.update(
      this.state.timeSec,
      dt,
      this.state.player.level,
      this.state.player.x,
      this.state.player.y,
      this.arenaRadius
    );
    for (const e of newEnemies) {
      this.state.enemies.push(e);
      if (e.behavior === "boss" && this.events.onBossSpawned) {
        this.events.onBossSpawned(e.typeId);
      }
    }

    // 4. Update Weapons & Projectile Spawns
    this.updateWeapons(dtMs);

    // 5. Update Projectiles
    this.updateProjectiles(dt, dtMs);

    // 6. Update Enemies AI & Movement
    this.updateEnemies(dt, dtMs);

    // 7. Check Collisions: Projectiles vs Enemies
    this.checkProjectileCollisions();

    // 8. Check Collisions: Enemies vs Player
    this.checkPlayerCollisions();

    // 9. Update Gems & Magnets
    this.updateGems(dt);

    // Save RNG state
    this.state.rngState = this.rng.getState();
  }

  private updatePlayerMovement(dx: number, dy: number, dt: number): void {
    const norm = CombatMath.normalize(dx, dy);
    this.state.player.vx = norm.x * this.state.player.speed;
    this.state.player.vy = norm.y * this.state.player.speed;

    this.state.player.x += this.state.player.vx * dt;
    this.state.player.y += this.state.player.vy * dt;

    // Clamp player inside circular arena bounds
    const distSq = this.state.player.x * this.state.player.x + this.state.player.y * this.state.player.y;
    const maxRadius = this.arenaRadius - 30;
    if (distSq > maxRadius * maxRadius) {
      const dist = Math.sqrt(distSq);
      this.state.player.x = (this.state.player.x / dist) * maxRadius;
      this.state.player.y = (this.state.player.y / dist) * maxRadius;
    }
  }

  private updateWeapons(dtMs: number): void {
    for (const weapon of this.state.player.weapons) {
      weapon.cooldownTimerMs -= dtMs;
      if (weapon.cooldownTimerMs <= 0) {
        const weaponDef = WEAPONS[weapon.id];
        if (!weaponDef) continue;

        const levelCfg = weaponDef.levels[Math.min(weapon.level - 1, weaponDef.levels.length - 1)];
        this.fireWeapon(weaponDef, levelCfg);

        // Reset cooldown scaled by cooldown multiplier
        const effectiveCooldown = levelCfg.cooldownMs * this.state.player.cooldownMultiplier;
        weapon.cooldownTimerMs = effectiveCooldown;
      }
    }
  }

  private fireWeapon(def: WeaponDef, levelCfg: any): void {
    const px = this.state.player.x;
    const py = this.state.player.y;

    if (def.category === "orbit") {
      // Orbiting blades: spawn or refresh rotating nodes
      // Handled via orbiting projectiles that track player position
      const activeCount = this.state.projectiles.filter(p => p.weaponId === def.id).length;
      if (activeCount < levelCfg.projectilesCount) {
        for (let i = activeCount; i < levelCfg.projectilesCount; i++) {
          this.state.projectiles.push({
            id: this.nextProjId++,
            weaponId: def.id,
            x: px,
            y: py,
            vx: 0,
            vy: 0,
            damage: levelCfg.damage,
            radius: 18 * this.state.player.areaMultiplier,
            pierceRemaining: 9999,
            durationMsRemaining: 999999,
            isEnemy: false,
            hitEnemyIds: new Set(),
          });
        }
      }
      return;
    }

    // Find closest enemies for targeting
    const closestEnemies = this.getClosestEnemies(levelCfg.projectilesCount);

    if (def.category === "projectile") {
      for (let i = 0; i < levelCfg.projectilesCount; i++) {
        const target = closestEnemies[i % (closestEnemies.length || 1)];
        let targetAngle = this.rng.next() * Math.PI * 2;
        if (target) {
          targetAngle = Math.atan2(target.y - py, target.x - px);
          // Add slight spread if multiple projectiles
          if (levelCfg.projectilesCount > 1) {
            targetAngle += (i - (levelCfg.projectilesCount - 1) / 2) * 0.18;
          }
        }

        const vx = Math.cos(targetAngle) * levelCfg.speed;
        const vy = Math.sin(targetAngle) * levelCfg.speed;

        this.state.projectiles.push({
          id: this.nextProjId++,
          weaponId: def.id,
          x: px,
          y: py,
          vx,
          vy,
          damage: levelCfg.damage,
          radius: 10 * this.state.player.areaMultiplier,
          pierceRemaining: levelCfg.pierce,
          durationMsRemaining: 2500,
          isEnemy: false,
          hitEnemyIds: new Set(),
        });
      }
    } else if (def.category === "area") {
      for (let i = 0; i < levelCfg.projectilesCount; i++) {
        const target = closestEnemies[i] || { x: px + (this.rng.next() - 0.5) * 300, y: py + (this.rng.next() - 0.5) * 300 };
        this.state.projectiles.push({
          id: this.nextProjId++,
          weaponId: def.id,
          x: target.x,
          y: target.y,
          vx: 0,
          vy: 0,
          damage: levelCfg.damage,
          radius: 55 * levelCfg.areaMultiplier * this.state.player.areaMultiplier,
          pierceRemaining: 9999,
          durationMsRemaining: levelCfg.durationMs || 400,
          isEnemy: false,
          hitEnemyIds: new Set(),
        });
      }
    } else if (def.category === "chain" || def.category === "beam") {
      for (let i = 0; i < levelCfg.projectilesCount; i++) {
        const target = closestEnemies[i];
        if (target) {
          const angle = Math.atan2(target.y - py, target.x - px);
          this.state.projectiles.push({
            id: this.nextProjId++,
            weaponId: def.id,
            x: px + Math.cos(angle) * 30,
            y: py + Math.sin(angle) * 30,
            vx: Math.cos(angle) * 550,
            vy: Math.sin(angle) * 550,
            damage: levelCfg.damage,
            radius: 14 * this.state.player.areaMultiplier,
            pierceRemaining: levelCfg.pierce,
            durationMsRemaining: 1200,
            isEnemy: false,
            chainRemaining: 4,
            hitEnemyIds: new Set(),
          });
        }
      }
    }
  }

  private updateProjectiles(dt: number, dtMs: number): void {
    const px = this.state.player.x;
    const py = this.state.player.y;

    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      p.durationMsRemaining -= dtMs;

      if (p.durationMsRemaining <= 0 || p.pierceRemaining <= 0) {
        this.state.projectiles.splice(i, 1);
        continue;
      }

      const weaponDef = WEAPONS[p.weaponId];
      if (weaponDef && weaponDef.category === "orbit") {
        // Orbit calculation
        const bladeIndex = i;
        const totalOrbiters = Math.max(1, this.state.projectiles.filter(pr => pr.weaponId === p.weaponId).length);
        const orbitSpeed = 3.2;
        const orbitRadius = 85 * this.state.player.areaMultiplier;
        const angle = this.state.timeSec * orbitSpeed + (bladeIndex * (Math.PI * 2) / totalOrbiters);
        p.x = px + Math.cos(angle) * orbitRadius;
        p.y = py + Math.sin(angle) * orbitRadius;
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      // Remove projectiles leaving arena bounds
      const distSq = p.x * p.x + p.y * p.y;
      if (distSq > (this.arenaRadius + 200) * (this.arenaRadius + 200)) {
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number, dtMs: number): void {
    const px = this.state.player.x;
    const py = this.state.player.y;

    for (let i = 0; i < this.state.enemies.length; i++) {
      const e = this.state.enemies[i];
      const dx = px - e.x;
      const dy = py - e.y;
      const norm = CombatMath.normalize(dx, dy);

      if (e.behavior === "chase" || e.behavior === "boss") {
        e.vx = norm.x * e.speed;
        e.vy = norm.y * e.speed;
      } else if (e.behavior === "swarm") {
        // Direct chase with slight wobble
        const wobble = Math.sin(this.state.timeSec * 4 + e.id) * 0.3;
        e.vx = (norm.x + wobble) * e.speed;
        e.vy = (norm.y - wobble) * e.speed;
      } else if (e.behavior === "charge") {
        e.chargeCooldownMs -= dtMs;
        if (e.chargeCooldownMs <= 0) {
          // Rush at 2.5x speed
          e.isCharging = true;
          e.vx = norm.x * e.speed * 2.5;
          e.vy = norm.y * e.speed * 2.5;
          if (e.chargeCooldownMs <= -800) {
            e.isCharging = false;
            e.chargeCooldownMs = 3000;
          }
        } else {
          e.vx = norm.x * e.speed * 0.7;
          e.vy = norm.y * e.speed * 0.7;
        }
      } else if (e.behavior === "ranged") {
        // Maintain distance of ~250 units
        if (norm.length < 220) {
          e.vx = -norm.x * e.speed;
          e.vy = -norm.y * e.speed;
        } else if (norm.length > 320) {
          e.vx = norm.x * e.speed;
          e.vy = norm.y * e.speed;
        } else {
          e.vx = -norm.y * e.speed * 0.8;
          e.vy = norm.x * e.speed * 0.8;
        }

        e.shootCooldownMs -= dtMs;
        if (e.shootCooldownMs <= 0) {
          e.shootCooldownMs = 2800;
          this.state.projectiles.push({
            id: this.nextProjId++,
            weaponId: "enemy_plasma",
            x: e.x,
            y: e.y,
            vx: norm.x * 220,
            vy: norm.y * 220,
            damage: e.damage,
            radius: 8,
            pierceRemaining: 1,
            durationMsRemaining: 4000,
            isEnemy: true,
            hitEnemyIds: new Set(),
          });
        }
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  }

  private checkProjectileCollisions(): void {
    for (let pIdx = this.state.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const p = this.state.projectiles[pIdx];
      if (p.isEnemy) continue;

      for (let eIdx = this.state.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.state.enemies[eIdx];
        if (p.hitEnemyIds.has(e.id)) continue;

        if (CombatMath.circlesOverlap(p.x, p.y, p.radius, e.x, e.y, e.radius)) {
          p.hitEnemyIds.add(e.id);
          p.pierceRemaining--;

          // Calculate damage
          const out = CombatMath.calculateOutgoingDamage(
            p.damage,
            this.state.player.mightBonus,
            this.state.player.critChance,
            this.state.player.critMultiplier,
            this.rng.next()
          );

          e.hp -= out.damage;
          this.totalDamageDealt += out.damage;

          if (this.events.onDamage) {
            this.events.onDamage({
              tick: this.state.tick,
              targetType: "enemy",
              targetId: e.id,
              damage: out.damage,
              isCrit: out.isCrit,
              x: e.x,
              y: e.y,
            });
          }

          // Check if enemy destroyed
          if (e.hp <= 0) {
            this.handleEnemyDeath(e, eIdx);
          }

          if (p.pierceRemaining <= 0) {
            this.state.projectiles.splice(pIdx, 1);
            break;
          }
        }
      }
    }
  }

  private handleEnemyDeath(e: EnemySimState, index: number): void {
    this.state.enemies.splice(index, 1);
    this.state.kills++;
    this.state.score += e.xpValue * 10 * (1 + this.state.combo * 0.05);

    // Increase combo
    this.state.combo++;
    this.state.comboTimerMs = 3500; // 3.5s combo window

    // Drop XP Gem
    this.state.gems.push({
      id: this.nextGemId++,
      x: e.x,
      y: e.y,
      xpValue: e.xpValue,
      isStardust: this.rng.next() < e.stardustDropChance,
      isMagnetized: false,
    });

    if (this.events.onKill) {
      this.events.onKill({
        tick: this.state.tick,
        enemyTypeId: e.typeId,
        x: e.x,
        y: e.y,
        xpValue: e.xpValue,
      });
    }

    // Check boss victory
    if (e.typeId === "boss_harbinger") {
      this.state.isVictory = true;
      this.state.isGameOver = true;
      if (this.events.onGameOver) {
        this.events.onGameOver(this.getRunStats(), true);
      }
    }
  }

  private checkPlayerCollisions(): void {
    if (this.state.player.invulnerableTimerMs > 0 || this.state.player.isDead) return;

    const px = this.state.player.x;
    const py = this.state.player.y;
    const pRadius = 14;

    // Check enemy body contact
    for (const e of this.state.enemies) {
      if (CombatMath.circlesOverlap(px, py, pRadius, e.x, e.y, e.radius)) {
        this.damagePlayer(e.damage, e.x, e.y);
        break;
      }
    }

    // Check enemy projectiles
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      if (!p.isEnemy) continue;

      if (CombatMath.circlesOverlap(px, py, pRadius, p.x, p.y, p.radius)) {
        this.damagePlayer(p.damage, p.x, p.y);
        this.state.projectiles.splice(i, 1);
        break;
      }
    }
  }

  private damagePlayer(rawDamage: number, sourceX: number, sourceY: number): void {
    const actualDamage = CombatMath.calculateIncomingDamage(rawDamage, this.state.player.armor);
    this.state.player.hp -= actualDamage;
    this.totalDamageTaken += actualDamage;
    this.state.player.invulnerableTimerMs = 600; // 600ms iframes
    this.state.combo = 0; // reset combo streak on damage

    if (this.events.onDamage) {
      this.events.onDamage({
        tick: this.state.tick,
        targetType: "player",
        targetId: 0,
        damage: actualDamage,
        isCrit: false,
        x: this.state.player.x,
        y: this.state.player.y,
      });
    }

    if (this.state.player.hp <= 0) {
      this.state.player.hp = 0;
      this.state.player.isDead = true;
      this.state.isGameOver = true;

      if (this.events.onGameOver) {
        this.events.onGameOver(this.getRunStats(), false);
      }
    }
  }

  private updateGems(dt: number): void {
    const px = this.state.player.x;
    const py = this.state.player.y;
    const magnetRadius = this.state.player.magnetRadius;

    for (let i = this.state.gems.length - 1; i >= 0; i--) {
      const gem = this.state.gems[i];
      const dx = px - gem.x;
      const dy = py - gem.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= magnetRadius * magnetRadius) {
        gem.isMagnetized = true;
      }

      if (gem.isMagnetized) {
        const norm = CombatMath.normalize(dx, dy);
        gem.x += norm.x * 420 * dt;
        gem.y += norm.y * 420 * dt;

        // Pickup collision
        if (distSq <= 24 * 24) {
          this.state.gems.splice(i, 1);
          if (gem.isStardust) {
            this.state.stardust++;
          }
          this.addXp(gem.xpValue);
        }
      }
    }
  }

  public addXp(amount: number): void {
    this.state.player.currentXp += amount;
    while (this.state.player.currentXp >= this.state.player.nextLevelXp) {
      this.state.player.currentXp -= this.state.player.nextLevelXp;
      this.state.player.level++;
      this.state.player.nextLevelXp = CombatMath.calculateXpForNextLevel(this.state.player.level);
      this.state.pendingLevelUps++;

      const choices = this.generateLevelUpChoices();
      this.state.activeLevelUpChoices = choices;

      if (this.events.onLevelUp) {
        this.events.onLevelUp(this.state.player.level, choices);
      }
    }
  }

  public selectUpgrade(upgradeId: string): void {
    if (this.state.pendingLevelUps > 0) {
      this.state.pendingLevelUps--;
    }

    // Check if weapon
    const existingWeapon = this.state.player.weapons.find(w => w.id === upgradeId);
    if (existingWeapon) {
      existingWeapon.level++;
    } else if (WEAPONS[upgradeId] && this.state.player.weapons.length < 4) {
      this.state.player.weapons.push({ id: upgradeId, level: 1, cooldownTimerMs: 0 });
    }

    // Check if passive
    const existingPassive = this.state.player.passives.find(p => p.id === upgradeId);
    if (existingPassive) {
      existingPassive.level++;
    } else if (PASSIVES[upgradeId] && this.state.player.passives.length < 4) {
      this.state.player.passives.push({ id: upgradeId, level: 1 });
    }

    this.recalculatePlayerStats();
    this.state.activeLevelUpChoices = undefined;
  }

  private generateLevelUpChoices(): string[] {
    const pool: string[] = [];

    // Eligible weapons
    for (const [wId, def] of Object.entries(WEAPONS)) {
      const held = this.state.player.weapons.find(w => w.id === wId);
      if (held && held.level < def.levels.length) {
        pool.push(wId);
      } else if (!held && this.state.player.weapons.length < 4) {
        pool.push(wId);
      }
    }

    // Eligible passives
    for (const [pId, def] of Object.entries(PASSIVES)) {
      const held = this.state.player.passives.find(p => p.id === pId);
      if (held && held.level < def.maxLevel) {
        pool.push(pId);
      } else if (!held && this.state.player.passives.length < 4) {
        pool.push(pId);
      }
    }

    // Pick 3 random unique items from pool
    const shuffled = this.rng.shuffle([...pool]);
    return shuffled.slice(0, 3);
  }

  private recalculatePlayerStats(): void {
    let mightBonus = 0;
    let speedBonus = 0;
    let magnetBonus = 0;
    let armorBonus = 0;
    let cooldownReduction = 0;
    let areaBonus = 0;
    let critChanceBonus = 0;
    let critDamageBonus = 0;

    for (const passive of this.state.player.passives) {
      const def = PASSIVES[passive.id];
      if (!def) continue;
      const lvl = passive.level;
      if (def.statModifier.mightBonus) mightBonus += def.statModifier.mightBonus * lvl;
      if (def.statModifier.speedBonus) speedBonus += def.statModifier.speedBonus * lvl;
      if (def.statModifier.magnetRadiusBonus) magnetBonus += def.statModifier.magnetRadiusBonus * lvl;
      if (def.statModifier.armorBonus) armorBonus += def.statModifier.armorBonus * lvl;
      if (def.statModifier.cooldownReduction) cooldownReduction += def.statModifier.cooldownReduction * lvl;
      if (def.statModifier.areaBonus) areaBonus += def.statModifier.areaBonus * lvl;
      if (def.statModifier.critChanceBonus) critChanceBonus += def.statModifier.critChanceBonus * lvl;
      if (def.statModifier.critDamageBonus) critDamageBonus += def.statModifier.critDamageBonus * lvl;
    }

    this.state.player.mightBonus = mightBonus;
    this.state.player.speed = 210 * (1 + speedBonus);
    this.state.player.magnetRadius = 100 * (1 + magnetBonus);
    this.state.player.armor = armorBonus;
    this.state.player.cooldownMultiplier = Math.max(0.3, 1.0 - cooldownReduction);
    this.state.player.areaMultiplier = 1.0 + areaBonus;
    this.state.player.critChance = 0.05 + critChanceBonus;
    this.state.player.critMultiplier = 1.5 + critDamageBonus;
  }

  private getClosestEnemies(count: number): EnemySimState[] {
    const px = this.state.player.x;
    const py = this.state.player.y;

    return [...this.state.enemies]
      .sort((a, b) => {
        const distA = (a.x - px) * (a.x - px) + (a.y - py) * (a.y - py);
        const distB = (b.x - px) * (b.x - px) + (b.y - py) * (b.y - py);
        return distA - distB;
      })
      .slice(0, count);
  }

  public getRunStats(): SimRunStats {
    return {
      score: this.state.score,
      durationMs: Math.round(this.state.timeSec * 1000),
      kills: this.state.kills,
      levelReached: this.state.player.level,
      stardustEarned: this.state.stardust,
      damageDealt: Math.round(this.totalDamageDealt),
      damageTaken: Math.round(this.totalDamageTaken),
      weaponsFinal: this.state.player.weapons.map(w => ({ id: w.id, level: w.level })),
      passivesFinal: this.state.player.passives.map(p => ({ id: p.id, level: p.level })),
    };
  }
}
