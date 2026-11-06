"use client";

import React from "react";
import { Pause, Flame, Skull, Shield, Zap } from "lucide-react";

interface HUDProps {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  timeSec: number;
  kills: number;
  score: number;
  hp: number;
  maxHp: number;
  combo: number;
  onPause: () => void;
}

export function HUD({
  level,
  currentXp,
  nextLevelXp,
  timeSec,
  kills,
  score,
  hp,
  maxHp,
  combo,
  onPause,
}: HUDProps) {
  const xpPercent = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));
  const hpPercent = Math.min(100, Math.max(0, (hp / maxHp) * 100));

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 z-10">
      {/* Top Header: XP Bar & Stats */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
        {/* XP Progress Bar */}
        <div className="relative w-full h-4 bg-cosmic-card/80 backdrop-blur-md rounded-full border border-cosmic-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cosmic-cyan via-cosmic-purple to-cosmic-magenta transition-all duration-150 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
            LVL {level} — {Math.round(currentXp)} / {Math.round(nextLevelXp)} XP
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-between mt-1">
          {/* HP Bar */}
          <div className="flex items-center gap-2">
            <div className="relative w-36 sm:w-48 h-5 bg-cosmic-card/80 backdrop-blur-md rounded-md border border-cosmic-border overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                {Math.round(hp)} / {Math.round(maxHp)} HP
              </div>
            </div>
          </div>

          {/* Center Run Timer */}
          <div className="text-xl sm:text-2xl font-black text-cosmic-amber tracking-widest font-mono drop-shadow-[0_0_10px_rgba(255,183,3,0.5)]">
            {formatTime(timeSec)}
          </div>

          {/* Right Metrics & Pause */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-400">
              <Skull className="w-4 h-4 text-rose-500" />
              <span>{kills}</span>
            </div>

            <div className="text-xs sm:text-sm font-bold text-cosmic-cyan">
              {score.toLocaleString()} PTS
            </div>

            <button
              onClick={onPause}
              className="pointer-events-auto p-1.5 rounded-lg bg-cosmic-surface/90 border border-cosmic-border hover:border-cosmic-cyan transition text-white"
              title="Pause Game (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Combo Streak Notification */}
      {combo > 2 && (
        <div className="self-center animate-bounce flex items-center gap-1.5 px-3 py-1 bg-cosmic-surface/90 border border-cosmic-amber/50 rounded-full shadow-[0_0_15px_rgba(255,183,3,0.4)]">
          <Flame className="w-4 h-4 text-cosmic-amber animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold text-cosmic-amber tracking-wider">
            {combo}X COMBO STREAK!
          </span>
        </div>
      )}

      {/* Bottom spacer for mobile touch controls */}
      <div className="h-10" />
    </div>
  );
}
