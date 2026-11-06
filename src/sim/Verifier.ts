import { Simulation } from "./Simulation";
import { SimInputDelta, SimRunStats } from "./Types";

export interface VerificationResult {
  verified: boolean;
  scoreMatch: boolean;
  killsMatch: boolean;
  levelMatch: boolean;
  expectedScore: number;
  actualScore: number;
  expectedKills: number;
  actualKills: number;
  expectedLevel: number;
  actualLevel: number;
  durationMs: number;
  reason?: string;
}

export class Verifier {
  /**
   * Fast-forwards simulation headlessly from seed and input deltas to verify submitted run integrity.
   */
  public static verifyRun(
    seed: number,
    characterId: string,
    arenaId: string,
    inputLog: SimInputDelta[],
    claimedStats: SimRunStats
  ): VerificationResult {
    const sim = new Simulation(seed, characterId, arenaId);
    let deltaIdx = 0;
    let curDx = 0;
    let curDy = 0;

    const maxTicks = Math.ceil((claimedStats.durationMs / 1000) * 60) + 60; // Up to claimed duration + 1s tolerance

    for (let tick = 0; tick < maxTicks; tick++) {
      // Check if there's an input update for this tick
      while (deltaIdx < inputLog.length && inputLog[deltaIdx].tick <= tick) {
        curDx = inputLog[deltaIdx].dx;
        curDy = inputLog[deltaIdx].dy;
        deltaIdx++;
      }

      // Auto-pick first upgrade if pending level-up during headless sim
      if (sim.state.activeLevelUpChoices && sim.state.activeLevelUpChoices.length > 0) {
        sim.selectUpgrade(sim.state.activeLevelUpChoices[0]);
      }

      sim.tick(curDx, curDy, 1 / 60);

      if (sim.state.isGameOver) break;
    }

    const simStats = sim.getRunStats();

    // Tolerances: allow minor float/timing leeway (e.g. 5% score, +/- 2 kills)
    const scoreDiff = Math.abs(simStats.score - claimedStats.score);
    const scoreTolerance = Math.max(50, claimedStats.score * 0.08);
    const scoreMatch = scoreDiff <= scoreTolerance;

    const killsDiff = Math.abs(simStats.kills - claimedStats.kills);
    const killsMatch = killsDiff <= Math.max(3, claimedStats.kills * 0.05);

    const levelMatch = Math.abs(simStats.levelReached - claimedStats.levelReached) <= 1;

    const verified = scoreMatch && killsMatch && levelMatch;

    return {
      verified,
      scoreMatch,
      killsMatch,
      levelMatch,
      expectedScore: claimedStats.score,
      actualScore: simStats.score,
      expectedKills: claimedStats.kills,
      actualKills: simStats.kills,
      expectedLevel: claimedStats.levelReached,
      actualLevel: simStats.levelReached,
      durationMs: simStats.durationMs,
      reason: verified ? "Run successfully re-simulated with matching metrics." : "Simulation metrics diverged from claimed stats.",
    };
  }
}
