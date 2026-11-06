import { Simulation } from "../src/sim/Simulation";
import { Mulberry32 } from "../src/sim/Mulberry32";

interface SimReport {
  totalRuns: number;
  victories: number;
  winRatePercent: number;
  avgSurvivalSec: number;
  avgKills: number;
  avgScore: number;
  weaponPickRates: Record<string, number>;
}

export function runBalanceSimulation(runsCount: number = 200): SimReport {
  console.log(`Starting headless balance simulation (${runsCount} runs)...`);
  const botRng = new Mulberry32(101010);

  let victories = 0;
  let totalSurvivalSec = 0;
  let totalKills = 0;
  let totalScore = 0;
  const weaponPicks: Record<string, number> = {};

  const chars = ["vanguard", "reaver", "solaris"];

  for (let r = 0; r < runsCount; r++) {
    const char = chars[r % chars.length];
    const seed = botRng.nextInt(1, 9999999);
    const sim = new Simulation(seed, char, "neon_orbit");

    // Headless bot loop: up to 5 minutes (18,000 ticks)
    for (let tick = 0; tick < 18000; tick++) {
      // Simple bot movement heuristic: dodge in alternating circles
      const dx = Math.sin(tick * 0.05);
      const dy = Math.cos(tick * 0.05);

      // Auto-pick upgrades if available
      if (sim.state.activeLevelUpChoices && sim.state.activeLevelUpChoices.length > 0) {
        const choice = sim.state.activeLevelUpChoices[0];
        weaponPicks[choice] = (weaponPicks[choice] || 0) + 1;
        sim.selectUpgrade(choice);
      }

      sim.tick(dx, dy, 1 / 60);

      if (sim.state.isGameOver) break;
    }

    const stats = sim.getRunStats();
    if (sim.state.isVictory) victories++;
    totalSurvivalSec += stats.durationMs / 1000;
    totalKills += stats.kills;
    totalScore += stats.score;
  }

  const report: SimReport = {
    totalRuns: runsCount,
    victories,
    winRatePercent: Math.round((victories / runsCount) * 1000) / 10,
    avgSurvivalSec: Math.round(totalSurvivalSec / runsCount),
    avgKills: Math.round(totalKills / runsCount),
    avgScore: Math.round(totalScore / runsCount),
    weaponPickRates: weaponPicks,
  };

  console.log("=== HEADLESS BALANCE SIMULATION REPORT ===");
  console.log(`Total Runs: ${report.totalRuns}`);
  console.log(`Win Rate: ${report.winRatePercent}%`);
  console.log(`Average Survival Time: ${report.avgSurvivalSec}s`);
  console.log(`Average Kills: ${report.avgKills}`);
  console.log(`Average Score: ${report.avgScore}`);
  console.log("Top Upgrades Chosen:", Object.entries(weaponPicks).sort((a, b) => b[1] - a[1]).slice(0, 5));

  return report;
}

runBalanceSimulation(100);
