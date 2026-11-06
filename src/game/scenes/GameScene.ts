import * as Phaser from "phaser";
import { Simulation } from "../../sim/Simulation";
import { eventBus, EVENTS } from "../../lib/EventBus";
import { soundEngine } from "../audio/SoundEngine";
import { musicSynthesizer } from "../audio/MusicSynthesizer";
import { GuestStorage } from "../../lib/guestStorage";
import { CHARACTERS } from "../../data/characters";

export class GameScene extends Phaser.Scene {
  private sim!: Simulation;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
  private touchDx: number = 0;
  private touchDy: number = 0;

  private enemySprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private projectileSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
  private gemSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();

  private backgroundGrid!: Phaser.GameObjects.Grid;
  private starsEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private timeAccumulator: number = 0;
  private readonly FIXED_TIMESTEP: number = 1 / 60; // 60Hz tick
  private isSimulationPaused: boolean = false;

  private activeCharacterId: string = "vanguard";
  private activeArenaId: string = "neon_orbit";

  constructor() {
    super({ key: "GameScene" });
  }

  public init(data: { characterId?: string; arenaId?: string; seed?: number }): void {
    this.activeCharacterId = data.characterId || "vanguard";
    this.activeArenaId = data.arenaId || "neon_orbit";
    const runSeed = data.seed || Math.floor(Math.random() * 1000000);

    this.sim = new Simulation(runSeed, this.activeCharacterId, this.activeArenaId);
  }

  public create(): void {
    // 1. Camera & Arena Bounds
    this.cameras.main.setBounds(-1500, -1500, 3000, 3000);
    this.cameras.main.setBackgroundColor("#070814");

    // 2. Cosmic Background Grid & Arena Ring
    this.backgroundGrid = this.add.grid(0, 0, 3000, 3000, 64, 64, 0x070814, 0.9, 0x161933, 0.4);
    const borderCircle = this.add.circle(0, 0, 1200);
    borderCircle.setStrokeStyle(3, 0x00f0ff, 0.35);

    // 3. Player Sprite
    const charDef = CHARACTERS[this.activeCharacterId] || CHARACTERS.vanguard;
    this.playerSprite = this.add.sprite(0, 0, charDef.spriteKey);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

    // 4. Keyboard Controls Setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      }) as { [key: string]: Phaser.Input.Keyboard.Key };
    }

    // 5. Connect Simulation Callbacks
    this.setupSimulationCallbacks();

    // 6. Connect EventBus Listeners
    this.setupEventBus();

    // 7. Start Dynamic Background Synth Music
    musicSynthesizer.start();

    // 8. Auto-pause on tab blur
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.pauseGame();
    });
  }

  private setupSimulationCallbacks(): void {
    // Damage callback: flash sprite, damage text, camera shake
    this.sim.events.onDamage = (event) => {
      if (event.targetType === "enemy") {
        soundEngine.playLaser(event.isCrit ? 1.4 : 1.0);
        this.showDamageNumber(event.x, event.y, event.damage, event.isCrit);
      } else {
        // Player damaged: hit-stop, shake, sound
        soundEngine.playPlayerHit();
        const settings = GuestStorage.load().settings;
        if (!settings.reducedMotion && settings.screenShakeIntensity > 0) {
          this.cameras.main.shake(120, 0.015 * settings.screenShakeIntensity);
        }
        eventBus.emit(EVENTS.PLAYER_HP_CHANGED, {
          hp: this.sim.state.player.hp,
          maxHp: this.sim.state.player.maxHp,
        });
      }
    };

    // Kill callback: sound, combo, particle explosion
    this.sim.events.onKill = (event) => {
      soundEngine.playExplosion(1.0);
      soundEngine.playGemPickup(this.sim.state.combo);
      this.spawnDeathBurst(event.x, event.y);

      eventBus.emit(EVENTS.COMBO_UPDATED, {
        combo: this.sim.state.combo,
        kills: this.sim.state.kills,
        score: this.sim.state.score,
      });
    };

    // Level up callback: slow motion, fanfare, open React upgrade modal
    this.sim.events.onLevelUp = (level, choices) => {
      soundEngine.playLevelUp();
      this.isSimulationPaused = true;

      eventBus.emit(EVENTS.LEVEL_UP, {
        level,
        choices,
      });
    };

    // Boss spawn event: siren alarm
    this.sim.events.onBossSpawned = (bossId) => {
      soundEngine.playBossWarning();
      this.cameras.main.flash(400, 255, 0, 85, true);
      eventBus.emit(EVENTS.BOSS_SPAWNED, { bossId });
    };

    // Game over / victory callback
    this.sim.events.onGameOver = (stats, isVictory) => {
      this.isSimulationPaused = true;
      musicSynthesizer.stop();

      // Persist Stardust locally
      GuestStorage.addStardust(stats.stardustEarned);

      eventBus.emit(EVENTS.RUN_COMPLETED, {
        stats,
        isVictory,
      });
    };
  }

  private setupEventBus(): void {
    // When player clicks upgrade card in React modal
    eventBus.on(EVENTS.SELECT_UPGRADE, (data: { upgradeId: string }) => {
      this.sim.selectUpgrade(data.upgradeId);
      this.isSimulationPaused = false;
    });

    // Virtual Joystick input from mobile touch
    eventBus.on("JOYSTICK_MOVE", (data: { dx: number; dy: number }) => {
      this.touchDx = data.dx;
      this.touchDy = data.dy;
    });

    eventBus.on(EVENTS.PAUSE_GAME, () => {
      this.pauseGame();
    });

    eventBus.on(EVENTS.RESUME_GAME, () => {
      this.isSimulationPaused = false;
    });

    eventBus.on(EVENTS.RESTART_RUN, (data?: { characterId?: string; arenaId?: string }) => {
      this.scene.restart(data);
    });
  }

  private pauseGame(): void {
    this.isSimulationPaused = true;
    eventBus.emit(EVENTS.PAUSE_GAME);
  }

  public update(time: number, delta: number): void {
    if (this.isSimulationPaused) return;

    // Convert delta ms to seconds and accumulate
    const dt = Math.min(delta / 1000, 0.1);
    this.timeAccumulator += dt;

    // Read Input (WASD / Arrows or Mobile Touch Joystick)
    let dx = this.touchDx;
    let dy = this.touchDy;

    if (this.cursors && this.wasdKeys) {
      if (this.cursors.left.isDown || this.wasdKeys.left.isDown) dx = -1;
      else if (this.cursors.right.isDown || this.wasdKeys.right.isDown) dx = 1;

      if (this.cursors.up.isDown || this.wasdKeys.up.isDown) dy = -1;
      else if (this.cursors.down.isDown || this.wasdKeys.down.isDown) dy = 1;
    }

    // Step fixed simulation loop (decoupled 60Hz tick)
    while (this.timeAccumulator >= this.FIXED_TIMESTEP) {
      this.sim.tick(dx, dy, this.FIXED_TIMESTEP);
      this.timeAccumulator -= this.FIXED_TIMESTEP;
    }

    // Update Adaptive Music Stems
    musicSynthesizer.updateIntensity(this.sim.state.timeSec);

    // Sync Visuals
    this.renderSync();

    // Sync HUD data with React
    eventBus.emit(EVENTS.XP_UPDATED, {
      level: this.sim.state.player.level,
      currentXp: this.sim.state.player.currentXp,
      nextLevelXp: this.sim.state.player.nextLevelXp,
      timeSec: Math.floor(this.sim.state.timeSec),
      kills: this.sim.state.kills,
      score: this.sim.state.score,
      hp: this.sim.state.player.hp,
      maxHp: this.sim.state.player.maxHp,
    });
  }

  private renderSync(): void {
    // 1. Player Sprite Position & Rotation
    this.playerSprite.setPosition(this.sim.state.player.x, this.sim.state.player.y);
    if (this.sim.state.player.vx !== 0 || this.sim.state.player.vy !== 0) {
      const angle = Math.atan2(this.sim.state.player.vy, this.sim.state.player.vx) + Math.PI / 2;
      this.playerSprite.setRotation(angle);
    }

    // Invulnerability flashing
    if (this.sim.state.player.invulnerableTimerMs > 0) {
      this.playerSprite.setAlpha(Math.sin(this.time.now * 0.05) > 0 ? 0.3 : 1.0);
    } else {
      this.playerSprite.setAlpha(1.0);
    }

    // 2. Enemies Sync
    const currentEnemyIds = new Set<number>();
    for (const e of this.sim.state.enemies) {
      currentEnemyIds.add(e.id);
      let spr = this.enemySprites.get(e.id);
      if (!spr) {
        const spriteKey = e.behavior === "boss" ? e.typeId : (e.typeId === "scout_viper" ? "enemy_viper" : (e.typeId === "heavy_crusher" ? "enemy_crusher" : "enemy_drone"));
        spr = this.add.sprite(e.x, e.y, spriteKey);
        this.enemySprites.set(e.id, spr);
      }
      spr.setPosition(e.x, e.y);
    }

    // Clean removed enemies
    Array.from(this.enemySprites.entries()).forEach(([id, spr]) => {
      if (!currentEnemyIds.has(id)) {
        spr.destroy();
        this.enemySprites.delete(id);
      }
    });

    // 3. Projectiles Sync
    const currentProjIds = new Set<number>();
    for (const p of this.sim.state.projectiles) {
      currentProjIds.add(p.id);
      let spr = this.projectileSprites.get(p.id);
      if (!spr) {
        const sprKey = p.isEnemy ? "enemy_plasma" : (p.weaponId === "orbital_blades" ? "bullet_blade" : (p.weaponId === "solar_flare" ? "bullet_flare" : "bullet_laser"));
        spr = this.add.sprite(p.x, p.y, sprKey);
        this.projectileSprites.set(p.id, spr);
      }
      spr.setPosition(p.x, p.y);
      if (p.vx !== 0 || p.vy !== 0) {
        spr.setRotation(Math.atan2(p.vy, p.vx));
      }
    }

    Array.from(this.projectileSprites.entries()).forEach(([id, spr]) => {
      if (!currentProjIds.has(id)) {
        spr.destroy();
        this.projectileSprites.delete(id);
      }
    });

    // 4. Gems Sync
    const currentGemIds = new Set<number>();
    for (const g of this.sim.state.gems) {
      currentGemIds.add(g.id);
      let spr = this.gemSprites.get(g.id);
      if (!spr) {
        spr = this.add.sprite(g.x, g.y, g.isStardust ? "gem_stardust" : "gem_xp");
        this.gemSprites.set(g.id, spr);
      }
      spr.setPosition(g.x, g.y);
    }

    Array.from(this.gemSprites.entries()).forEach(([id, spr]) => {
      if (!currentGemIds.has(id)) {
        spr.destroy();
        this.gemSprites.delete(id);
      }
    });
  }

  private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.add.text(x, y - 10, `${Math.round(damage)}`, {
      fontFamily: "sans-serif",
      fontSize: isCrit ? "20px" : "14px",
      fontStyle: isCrit ? "bold" : "normal",
      color: isCrit ? "#ffb703" : "#00f0ff",
      stroke: "#070814",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 35,
      alpha: 0,
      duration: 650,
      ease: "Power1",
      onComplete: () => text.destroy(),
    });
  }

  private spawnDeathBurst(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const spark = this.add.sprite(x, y, "particle_spark");
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;

      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => spark.destroy(),
      });
    }
  }
}
