export interface GameSettings {
  masterVolume: number; // 0.0 to 1.0
  sfxVolume: number;
  musicVolume: number;
  screenShakeIntensity: number; // 0.0 to 1.0
  reducedMotion: boolean;
  reducedFlash: boolean;
  colorblindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  autoAim: boolean;
}

export interface GuestSaveData {
  version: number;
  nickname?: string;
  stardust: number;
  unlockedCharacters: string[];
  unlockedArenas: string[];
  metaTreeRanks: Record<string, number>;
  unlockedAchievements: string[];
  highScore: number;
  totalKills: number;
  runsCount: number;
  settings: GameSettings;
  offlineRunsQueue: any[];
}

const STORAGE_KEY = "starfall_survivors_guest_save_v1";

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.7,
  screenShakeIntensity: 0.8,
  reducedMotion: false,
  reducedFlash: false,
  colorblindMode: "none",
  autoAim: true,
};

const DEFAULT_SAVE: GuestSaveData = {
  version: 1,
  stardust: 0,
  unlockedCharacters: ["vanguard"],
  unlockedArenas: ["neon_orbit"],
  metaTreeRanks: {},
  unlockedAchievements: [],
  highScore: 0,
  totalKills: 0,
  runsCount: 0,
  settings: DEFAULT_SETTINGS,
  offlineRunsQueue: [],
};

export class GuestStorage {
  public static load(): GuestSaveData {
    if (typeof window === "undefined") return DEFAULT_SAVE;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SAVE;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
        },
      };
    } catch {
      return DEFAULT_SAVE;
    }
  }

  public static save(data: GuestSaveData): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to persist save data to localStorage:", err);
    }
  }

  public static update(updater: (current: GuestSaveData) => GuestSaveData): GuestSaveData {
    const current = this.load();
    const updated = updater(current);
    this.save(updated);
    return updated;
  }

  public static addStardust(amount: number): number {
    const updated = this.update((save) => ({
      ...save,
      stardust: save.stardust + Math.max(0, amount),
    }));
    return updated.stardust;
  }

  public static purchaseMetaRank(nodeId: string, cost: number): boolean {
    const current = this.load();
    if (current.stardust < cost) return false;

    this.update((save) => {
      const currentRank = save.metaTreeRanks[nodeId] || 0;
      return {
        ...save,
        stardust: save.stardust - cost,
        metaTreeRanks: {
          ...save.metaTreeRanks,
          [nodeId]: currentRank + 1,
        },
      };
    });
    return true;
  }

  public static resetAll(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }
}
