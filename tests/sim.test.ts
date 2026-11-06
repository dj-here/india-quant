import { describe, it, expect } from "vitest";
import { Mulberry32, hashString } from "../src/sim/Mulberry32";
import { CombatMath } from "../src/sim/Combat";
import { Simulation } from "../src/sim/Simulation";
import { Verifier } from "../src/sim/Verifier";

describe("Mulberry32 PRNG", () => {
  it("produces identical pseudorandom sequences from identical seeds", () => {
    const rng1 = new Mulberry32(133742);
    const rng2 = new Mulberry32(133742);

    const seq1 = Array.from({ length: 20 }, () => rng1.next());
    const seq2 = Array.from({ length: 20 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it("produces uniform bounded integers", () => {
    const rng = new Mulberry32(999);
    for (let i = 0; i < 50; i++) {
      const val = rng.nextInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
    }
  });

  it("hashes strings deterministically", () => {
    const h1 = hashString("starfall-daily-2026-11-06");
    const h2 = hashString("starfall-daily-2026-11-06");
    const h3 = hashString("starfall-daily-2026-11-07");

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });
});

describe("CombatMath", () => {
  it("calculates superlinear XP progression curve", () => {
    const xp1 = CombatMath.calculateXpForNextLevel(1);
    const xp2 = CombatMath.calculateXpForNextLevel(2);
    const xp10 = CombatMath.calculateXpForNextLevel(10);
    const xp25 = CombatMath.calculateXpForNextLevel(25);

    expect(xp1).toBe(5);
    expect(xp2).toBe(10);
    expect(xp10).toBeGreaterThan(xp2);
    expect(xp25).toBeGreaterThan(xp10);
  });

  it("calculates critical strike damage and armor mitigation correctly", () => {
    const critHit = CombatMath.calculateOutgoingDamage(20, 0.5, 1.0, 2.0, 0.1);
    expect(critHit.isCrit).toBe(true);
    // base 20 * (1 + 0.5) = 30 * 2.0 = 60
    expect(critHit.damage).toBe(60);

    const incoming = CombatMath.calculateIncomingDamage(50, 100);
    // 50 * (100 / 200) = 25
    expect(incoming).toBe(25);
  });
});

describe("Simulation Determinism & Verifier", () => {
  it("runs identically given identical seed and input stream", () => {
    const seed = 424242;
    const sim1 = new Simulation(seed, "vanguard", "neon_orbit");
    const sim2 = new Simulation(seed, "vanguard", "neon_orbit");

    // Simulate 300 ticks (~5 seconds of game time)
    for (let i = 0; i < 300; i++) {
      const dx = (i % 60 < 30) ? 1 : -1;
      const dy = (i % 40 < 20) ? 1 : 0;
      sim1.tick(dx, dy, 1 / 60);
      sim2.tick(dx, dy, 1 / 60);
    }

    const stats1 = sim1.getRunStats();
    const stats2 = sim2.getRunStats();

    expect(stats1.score).toBe(stats2.score);
    expect(stats1.kills).toBe(stats2.kills);
    expect(stats1.levelReached).toBe(stats2.levelReached);
    expect(stats1.stardustEarned).toBe(stats2.stardustEarned);
    expect(stats1.damageDealt).toBe(stats2.damageDealt);
  });

  it("verifies a recorded run successfully via Verifier", () => {
    const seed = 777123;
    const sim = new Simulation(seed, "vanguard", "neon_orbit");

    for (let i = 0; i < 360; i++) {
      const dx = (i % 80 < 40) ? 1 : 0;
      const dy = (i % 50 < 25) ? -1 : 1;
      sim.tick(dx, dy, 1 / 60);
    }

    const runStats = sim.getRunStats();
    const inputLog = [...sim.inputLogger.getDeltas()];

    const result = Verifier.verifyRun(seed, "vanguard", "neon_orbit", inputLog, runStats);
    expect(result.verified).toBe(true);
  });
});
