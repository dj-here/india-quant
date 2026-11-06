export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  rewardType: "stardust" | "character" | "arena" | "cosmetic";
  rewardValue: string | number;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_blood", title: "First Contact", description: "Destroy your first enemy drone.", rewardType: "stardust", rewardValue: 25, icon: "target" },
  { key: "survivor_1", title: "Minute to Win It", description: "Survive 1:00 in any arena.", rewardType: "stardust", rewardValue: 50, icon: "clock" },
  { key: "survivor_3", title: "Deep Space Veteran", description: "Survive 3:00 in any arena.", rewardType: "character", rewardValue: "reaver", icon: "shield" },
  { key: "survivor_5", title: "Against the Odds", description: "Survive 5:00 and confront the Harbinger.", rewardType: "stardust", rewardValue: 200, icon: "flame" },
  { key: "boss_1_slayer", title: "Leviathan's End", description: "Defeat The Cosmic Leviathan.", rewardType: "character", rewardValue: "solaris", icon: "skull" },
  { key: "boss_2_slayer", title: "Starfall Savior", description: "Defeat The Starfall Harbinger and claim victory.", rewardType: "arena", rewardValue: "solar_flare_matrix", icon: "crown" },
  { key: "level_10", title: "Power Surge", description: "Reach Level 10 in a single run.", rewardType: "stardust", rewardValue: 50, icon: "zap" },
  { key: "level_25", title: "Overcharged", description: "Reach Level 25 in a single run.", rewardType: "stardust", rewardValue: 150, icon: "battery-charging" },
  { key: "level_40", title: "Transcendent", description: "Reach Level 40 in a single run.", rewardType: "stardust", rewardValue: 400, icon: "sparkles" },
  { key: "first_evolution", title: "Technological Singularity", description: "Evolve any weapon into its evolved form.", rewardType: "stardust", rewardValue: 100, icon: "cpu" },
  { key: "evolution_master", title: "Dual Singularity", description: "Equip 2 evolved weapons simultaneously in a single run.", rewardType: "stardust", rewardValue: 250, icon: "swords" },
  { key: "arsenal_complete", title: "Full Battery", description: "Fill all weapon slots with level 3+ weapons.", rewardType: "stardust", rewardValue: 75, icon: "crosshair" },
  { key: "passive_perfection", title: "Harmonic Convergence", description: "Fill all passive slots with upgrades.", rewardType: "stardust", rewardValue: 75, icon: "orbit" },
  { key: "untouchable", title: "Ghost in the Machine", description: "Survive 60 consecutive seconds without taking damage.", rewardType: "stardust", rewardValue: 150, icon: "eye-off" },
  { key: "stardust_100", title: "Cosmic Prospector", description: "Harvest 100 Stardust lifetime total.", rewardType: "stardust", rewardValue: 50, icon: "coins" },
  { key: "stardust_1000", title: "Nebula Magnate", description: "Harvest 1,000 Stardust lifetime total.", rewardType: "stardust", rewardValue: 200, icon: "gem" },
  { key: "stardust_10000", title: "Galactic Tycoon", description: "Harvest 10,000 Stardust lifetime total.", rewardType: "stardust", rewardValue: 1000, icon: "trophy" },
  { key: "meta_unlock_5", title: "Engineering Initiate", description: "Purchase 5 permanent ranks in the Meta Tree.", rewardType: "stardust", rewardValue: 100, icon: "tool" },
  { key: "meta_unlock_20", title: "Master Architect", description: "Purchase 20 permanent ranks in the Meta Tree.", rewardType: "stardust", rewardValue: 500, icon: "wrench" },
  { key: "daily_debut", title: "Daily Challenger", description: "Complete and submit a ranked Daily Challenge run.", rewardType: "stardust", rewardValue: 100, icon: "calendar" },
  { key: "daily_top50", title: "Elite Vanguard", description: "Rank in the top 50 on the Global Daily Leaderboard.", rewardType: "stardust", rewardValue: 300, icon: "medal" },
  { key: "vanguard_master", title: "Vanguard Ace", description: "Achieve victory playing as Nova Vanguard.", rewardType: "cosmetic", rewardValue: "trail_cyan_pulse", icon: "wind" },
  { key: "reaver_master", title: "Void Champion", description: "Achieve victory playing as Void Reaver.", rewardType: "cosmetic", rewardValue: "trail_void_spark", icon: "shield-check" },
  { key: "solaris_master", title: "Solar Archon", description: "Achieve victory playing as Solaris Priestess.", rewardType: "cosmetic", rewardValue: "trail_solar_corona", icon: "sun" },
  { key: "crit_king", title: "Critical Mass", description: "Land 100 critical strikes in a single run.", rewardType: "stardust", rewardValue: 120, icon: "crosshair" },
  { key: "combo_god", title: "Unbroken Chain", description: "Reach a 100+ kill combo streak.", rewardType: "stardust", rewardValue: 200, icon: "flame-kindling" },
  { key: "slayer_1000", title: "Exterminator", description: "Defeat 1,000 enemies in a single run.", rewardType: "stardust", rewardValue: 150, icon: "skull" },
  { key: "slayer_2500", title: "Armageddon", description: "Defeat 2,500 enemies in a single run.", rewardType: "stardust", rewardValue: 500, icon: "bomb" },
  { key: "speed_demon", title: "Faster than Light", description: "Attain 280+ movement speed via passives and meta upgrades.", rewardType: "stardust", rewardValue: 100, icon: "zap-fast" },
  { key: "flawless_victory", title: "Flawless Ascendance", description: "Defeat the final boss without taking damage during the encounter.", rewardType: "stardust", rewardValue: 1000, icon: "award" },
];
