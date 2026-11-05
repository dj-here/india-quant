# Starfall Survivors — Game Balancing & Math Specification (BALANCING.md)

This document formalizes the mathematical models governing player progression, damage calculation, XP curves, enemy spawn budgets, and balancing metrics for **Starfall Survivors**.

---

## 1. Pacing & Progression Curve (The 5-Minute Run)

A standard run is calibrated for **300 seconds (5:00)**:
- **0:00 - 0:30 (Hook Phase)**: Very low enemy pressure (Drones only). Instant gem drop on first kill. Guaranteed Level 2 within first 15-20 seconds.
- **0:30 - 1:30 (Build Foundation)**: Introduction of Swarmers and Skimmers. Player selects 2-3 new weapons or passives.
- **1:30 - 2:30 (Escalation & First Wall)**: Crusher tanks arrive. Player must demonstrate area damage or crowd control.
- **2:30 - 3:00 (Mini-Boss: Cosmic Leviathan)**: Screen clears of minor swarms; mini-boss spawns with laser sweeps and minefields. High Stardust and guaranteed chest drop.
- **3:00 - 4:00 (Chaos Phase)**: Splitters and Chargers flood the arena. Evolved weapons can be unlocked starting here.
- **4:00 - 4:45 (Final Wave Rush)**: Maximum budget density. Tests evolved weapon synergies.
- **4:45 - 5:00 (Breathing Room & Siren)**: 15-second lull for player to gather remaining gems before boss.
- **5:00 (Climax: Starfall Harbinger Boss)**: Final confrontation. Defeating the boss triggers victory, bonus Stardust, and unlocks higher difficulty arenas.

---

## 2. Mathematical Formulas

### A. Experience & Level-Up Curve
The XP needed to reach level $L$ scales super-linearly:
$$\text{XP}_{\text{req}}(L) = \begin{cases} 5 \times L & \text{if } L \le 3 \\ 15 + (L - 3) \times 12 + \lfloor 1.15^{L} \rfloor & \text{if } 3 < L \le 20 \\ 250 + (L - 20) \times 35 + \lfloor 1.22^{L - 20} \rfloor & \text{if } L > 20 \end{cases}$$

This ensures rapid level-ups every 15-25 seconds early game, tapering to meaningful strategic choices mid-to-late game (targeting level 25-35 by minute 5).

### B. Damage & Critical Strike Formula
$$\text{Damage}_{\text{final}} = \text{BaseDamage} \times (1 + \text{MightBonus}) \times \text{Multiplier}_{\text{evolution}}$$
$$\text{If } \text{rand}() < \text{CritChance}: \quad \text{Damage}_{\text{final}} = \text{Damage}_{\text{final}} \times \text{CritMultiplier}$$

### C. Armor & Damage Reduction
$$\text{DamageTaken} = \max\left(1, \, \text{IncomingDamage} \times \frac{100}{100 + \text{Armor}} - \text{FlatArmor}\right)$$

### D. Spawn Director Budget System
Every second, the spawn director increments the active spawn currency:
$$\text{Budget}(t) = \text{BaseBudget} + (\text{GrowthRate} \times t) \times \text{PlayerPowerScaling}$$
$$\text{PlayerPowerScaling} = 1 + (\text{PlayerLevel} \times 0.03)$$

When budget allows, the director chooses weighted enemies from the active wave interval table, deducts their spawn cost, and triggers spawn at a random position outside the camera viewport.

---

## 3. Headless Balancing Bot (`/scripts/simulate.ts`)

A deterministic headless bot runs 1,000 runs using greedy and randomized upgrade strategies:
- **Target Win Rate**: 15% - 25% for novice AI, 60% - 75% for optimal synergy AI.
- **Survival Distribution**: Median survival time: 3m 45s.
- **Weapon Pick Parity**: No single weapon or evolution should exceed a 40% pick rate across victorious runs.
