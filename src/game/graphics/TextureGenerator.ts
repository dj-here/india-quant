import * as Phaser from "phaser";

export class TextureGenerator {
  public static generateAllTextures(scene: Phaser.Scene): void {
    this.createPlayerTextures(scene);
    this.createEnemyTextures(scene);
    this.createBossTextures(scene);
    this.createProjectileTextures(scene);
    this.createPickupTextures(scene);
    this.createParticleTextures(scene);
  }

  private static createPlayerTextures(scene: Phaser.Scene): void {
    // 1. Nova Vanguard (Cyan Delta Fighter)
    const vCanvas = scene.textures.createCanvas("player_vanguard", 48, 48);
    if (vCanvas) {
      const ctx = vCanvas.context;
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(24, 4);
      ctx.lineTo(44, 40);
      ctx.lineTo(24, 32);
      ctx.lineTo(4, 40);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(24, 12);
      ctx.lineTo(28, 24);
      ctx.lineTo(20, 24);
      ctx.closePath();
      ctx.fill();

      vCanvas.refresh();
    }

    // 2. Void Reaver (Purple Interceptor)
    const rCanvas = scene.textures.createCanvas("player_reaver", 48, 48);
    if (rCanvas) {
      const ctx = rCanvas.context;
      ctx.fillStyle = "#9d4edd";
      ctx.shadowColor = "#9d4edd";
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(24, 2);
      ctx.lineTo(46, 36);
      ctx.lineTo(34, 44);
      ctx.lineTo(24, 28);
      ctx.lineTo(14, 44);
      ctx.lineTo(2, 36);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(24, 20, 4, 0, Math.PI * 2);
      ctx.fill();

      rCanvas.refresh();
    }

    // 3. Solaris Priestess (Golden Battlecruiser)
    const sCanvas = scene.textures.createCanvas("player_solaris", 52, 52);
    if (sCanvas) {
      const ctx = sCanvas.context;
      ctx.fillStyle = "#ffb703";
      ctx.shadowColor = "#ffb703";
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(26, 26, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(26, 26, 22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ff0055";
      ctx.beginPath();
      ctx.arc(26, 26, 6, 0, Math.PI * 2);
      ctx.fill();

      sCanvas.refresh();
    }
  }

  private static createEnemyTextures(scene: Phaser.Scene): void {
    // Enemy Drone (Angular cyan/pink diamond)
    const dCanvas = scene.textures.createCanvas("enemy_drone", 28, 28);
    if (dCanvas) {
      const ctx = dCanvas.context;
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(14, 2);
      ctx.lineTo(26, 14);
      ctx.lineTo(14, 26);
      ctx.lineTo(2, 14);
      ctx.closePath();
      ctx.fill();
      dCanvas.refresh();
    }

    // Scout Viper (Emerald triangle)
    const vCanvas = scene.textures.createCanvas("enemy_viper", 32, 32);
    if (vCanvas) {
      const ctx = vCanvas.context;
      ctx.fillStyle = "#06d6a0";
      ctx.shadowColor = "#06d6a0";
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(30, 28);
      ctx.lineTo(2, 28);
      ctx.closePath();
      ctx.fill();
      vCanvas.refresh();
    }

    // Heavy Crusher (Red Armored Hexagon)
    const cCanvas = scene.textures.createCanvas("enemy_crusher", 50, 50);
    if (cCanvas) {
      const ctx = cCanvas.context;
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = 25 + Math.cos(a) * 22;
        const y = 25 + Math.sin(a) * 22;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      cCanvas.refresh();
    }

    // Pulse Skimmer (Magenta disc)
    const sCanvas = scene.textures.createCanvas("enemy_skimmer", 34, 34);
    if (sCanvas) {
      const ctx = sCanvas.context;
      ctx.fillStyle = "#ff0077";
      ctx.shadowColor = "#ff0077";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(17, 17, 13, 0, Math.PI * 2);
      ctx.fill();
      sCanvas.refresh();
    }
  }

  private static createBossTextures(scene: Phaser.Scene): void {
    // Boss 1: Leviathan (Gigantic Multi-ring Serpent Head)
    const lCanvas = scene.textures.createCanvas("boss_leviathan", 100, 100);
    if (lCanvas) {
      const ctx = lCanvas.context;
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(50, 50, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#070814";
      ctx.beginPath();
      ctx.arc(50, 50, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00f0ff";
      ctx.beginPath();
      ctx.arc(50, 50, 12, 0, Math.PI * 2);
      ctx.fill();

      lCanvas.refresh();
    }

    // Boss 2: Harbinger (Grand Triangular Mothership)
    const hCanvas = scene.textures.createCanvas("boss_harbinger", 130, 130);
    if (hCanvas) {
      const ctx = hCanvas.context;
      ctx.fillStyle = "#ffb703";
      ctx.shadowColor = "#ffb703";
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.moveTo(65, 8);
      ctx.lineTo(122, 115);
      ctx.lineTo(65, 95);
      ctx.lineTo(8, 115);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ff0055";
      ctx.beginPath();
      ctx.arc(65, 60, 18, 0, Math.PI * 2);
      ctx.fill();

      hCanvas.refresh();
    }
  }

  private static createProjectileTextures(scene: Phaser.Scene): void {
    // Laser Bolt (Cyan capsule)
    const lCanvas = scene.textures.createCanvas("bullet_laser", 16, 16);
    if (lCanvas) {
      const ctx = lCanvas.context;
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(8, 8, 6, 0, Math.PI * 2);
      ctx.fill();
      lCanvas.refresh();
    }

    // Void Blade (Violet crescent)
    const bCanvas = scene.textures.createCanvas("bullet_blade", 24, 24);
    if (bCanvas) {
      const ctx = bCanvas.context;
      ctx.fillStyle = "#9d4edd";
      ctx.shadowColor = "#9d4edd";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI, false);
      ctx.fill();
      bCanvas.refresh();
    }

    // Solar Flare Explosion (Amber radial burst)
    const fCanvas = scene.textures.createCanvas("bullet_flare", 64, 64);
    if (fCanvas) {
      const ctx = fCanvas.context;
      const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#ffb703");
      grad.addColorStop(1, "rgba(255, 0, 85, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      fCanvas.refresh();
    }

    // Enemy Plasma (Hostile orange sphere)
    const epCanvas = scene.textures.createCanvas("enemy_plasma", 18, 18);
    if (epCanvas) {
      const ctx = epCanvas.context;
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(9, 9, 7, 0, Math.PI * 2);
      ctx.fill();
      epCanvas.refresh();
    }
  }

  private static createPickupTextures(scene: Phaser.Scene): void {
    // XP Gem (Glowing Cyan Rhombus)
    const gCanvas = scene.textures.createCanvas("gem_xp", 16, 16);
    if (gCanvas) {
      const ctx = gCanvas.context;
      ctx.fillStyle = "#00f0ff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(8, 1);
      ctx.lineTo(15, 8);
      ctx.lineTo(8, 15);
      ctx.lineTo(1, 8);
      ctx.closePath();
      ctx.fill();
      gCanvas.refresh();
    }

    // Stardust Gem (Golden Star)
    const sCanvas = scene.textures.createCanvas("gem_stardust", 20, 20);
    if (sCanvas) {
      const ctx = sCanvas.context;
      ctx.fillStyle = "#ffb703";
      ctx.shadowColor = "#ffb703";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const x1 = 10 + Math.cos(a) * 9;
        const y1 = 10 + Math.sin(a) * 9;
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        const a2 = a + Math.PI / 5;
        const x2 = 10 + Math.cos(a2) * 4;
        const y2 = 10 + Math.sin(a2) * 4;
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
      sCanvas.refresh();
    }
  }

  private static createParticleTextures(scene: Phaser.Scene): void {
    const pCanvas = scene.textures.createCanvas("particle_spark", 8, 8);
    if (pCanvas) {
      const ctx = pCanvas.context;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(4, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      pCanvas.refresh();
    }
  }
}
