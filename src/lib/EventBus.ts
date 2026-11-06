import { SimRunStats } from "../sim/Types";

export type GameEventCallback<T = any> = (data: T) => void;

class TypedEventBus {
  private listeners: Map<string, Set<GameEventCallback>> = new Map();

  public on<T = any>(event: string, callback: GameEventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off<T = any>(event: string, callback: GameEventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  public emit<T = any>(event: string, data?: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in EventBus listener for '${event}':`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new TypedEventBus();

// Typed Event Name Constants
export const EVENTS = {
  // Game -> React
  GAME_READY: "GAME_READY",
  PLAYER_HP_CHANGED: "PLAYER_HP_CHANGED",
  XP_UPDATED: "XP_UPDATED",
  LEVEL_UP: "LEVEL_UP",
  COMBO_UPDATED: "COMBO_UPDATED",
  BOSS_SPAWNED: "BOSS_SPAWNED",
  RUN_COMPLETED: "RUN_COMPLETED",
  ACHIEVEMENT_UNLOCKED: "ACHIEVEMENT_UNLOCKED",

  // React -> Game
  START_RUN: "START_RUN",
  RESTART_RUN: "RESTART_RUN",
  PAUSE_GAME: "PAUSE_GAME",
  RESUME_GAME: "RESUME_GAME",
  SELECT_UPGRADE: "SELECT_UPGRADE",
  SET_AUDIO_CONFIG: "SET_AUDIO_CONFIG",
  TOGGLE_REDUCED_MOTION: "TOGGLE_REDUCED_MOTION",
} as const;
