export interface ArenaDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  palette: {
    bg: string;
    grid: string;
    particlePrimary: string;
    particleSecondary: string;
  };
  hazardType: "asteroids" | "wormholes" | "solar_wind";
  hazardDescription: string;
  scoreMultiplier: number;
  unlockRequirement: string;
}

export const ARENAS: Record<string, ArenaDef> = {
  neon_orbit: {
    id: "neon_orbit",
    name: "Neon Orbit",
    subtitle: "Outer Defense Perimeter",
    description: "A neon grid suspended over high orbit. Floating asteroid debris drifts across the arena.",
    palette: {
      bg: "#070814",
      grid: "#161933",
      particlePrimary: "#00f0ff",
      particleSecondary: "#ff0077",
    },
    hazardType: "asteroids",
    hazardDescription: "Floating asteroid fragments block line of fire and burst into shrapnel on impact.",
    scoreMultiplier: 1.0,
    unlockRequirement: "Unlocked by default",
  },
  obsidian_void: {
    id: "obsidian_void",
    name: "Obsidian Void",
    subtitle: "Singularity Abyss",
    description: "An ominous dimensional anomaly with unstable micro-wormholes that displace spatial coordinates.",
    palette: {
      bg: "#05030a",
      grid: "#1c0d38",
      particlePrimary: "#9d4edd",
      particleSecondary: "#ffb703",
    },
    hazardType: "wormholes",
    hazardDescription: "Micro-wormholes pull entities inward and deal continuous spatial distortion damage.",
    scoreMultiplier: 1.25,
    unlockRequirement: "Reach Minute 3 in Neon Orbit",
  },
  solar_flare_matrix: {
    id: "solar_flare_matrix",
    name: "Solar Flare Matrix",
    subtitle: "Corona Supercollider",
    description: "Intense solar corona environment with periodic high-energy solar wind waves sweeping the arena.",
    palette: {
      bg: "#100604",
      grid: "#381409",
      particlePrimary: "#ffb703",
      particleSecondary: "#ff0055",
    },
    hazardType: "solar_wind",
    hazardDescription: "Periodic solar wind sweeps across the screen, dealing thermal radiation damage.",
    scoreMultiplier: 1.5,
    unlockRequirement: "Defeat Boss 2 (The Starfall Harbinger)",
  },
};
