/**
 * Starfall Survivors — Pure Combat & Progression Math
 * Implements strict mathematical formulas specified in BALANCING.md.
 */

export class CombatMath {
  /**
   * Calculates experience required to advance from level L to L+1.
   * Super-linear scaling curve ensures fast early upgrades with strategic late-game pacing.
   */
  public static calculateXpForNextLevel(level: number): number {
    if (level <= 1) return 5;
    if (level <= 3) return level * 5;
    if (level <= 20) {
      return Math.floor(15 + (level - 3) * 12 + Math.pow(1.15, level));
    }
    return Math.floor(250 + (level - 20) * 35 + Math.pow(1.22, level - 20));
  }

  /**
   * Calculates outgoing weapon damage including Might bonuses, evolution modifiers, and critical strikes.
   */
  public static calculateOutgoingDamage(
    baseDamage: number,
    mightBonus: number,
    critChance: number,
    critMultiplier: number,
    rngRoll: number
  ): { damage: number; isCrit: boolean } {
    let damage = baseDamage * (1 + Math.max(0, mightBonus));
    const isCrit = rngRoll < critChance;
    if (isCrit) {
      damage *= critMultiplier;
    }
    // Round to 1 decimal place to prevent JS float divergence
    return {
      damage: Math.round(damage * 10) / 10,
      isCrit,
    };
  }

  /**
   * Calculates incoming damage taken by player after applying armor reduction.
   */
  public static calculateIncomingDamage(rawDamage: number, armor: number): number {
    if (rawDamage <= 0) return 0;
    const mitigated = rawDamage * (100 / (100 + Math.max(0, armor)));
    return Math.max(1, Math.round(mitigated * 10) / 10);
  }

  /**
   * 2D Euclidean distance check for circular hitboxes
   */
  public static circlesOverlap(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number
  ): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const radiusSum = r1 + r2;
    return dx * dx + dy * dy <= radiusSum * radiusSum;
  }

  /**
   * Normalizes direction vector with zero-length safety
   */
  public static normalize(dx: number, dy: number): { x: number; y: number; length: number } {
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { x: 0, y: 0, length: 0 };
    const len = Math.sqrt(lenSq);
    return { x: dx / len, y: dy / len, length: len };
  }
}
