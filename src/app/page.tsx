"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { HUD } from "@/components/HUD";
import { UpgradeModal } from "@/components/UpgradeModal";
import { PauseModal } from "@/components/PauseModal";
import { GameOverModal } from "@/components/GameOverModal";
import { MetaShopModal } from "@/components/MetaShopModal";
import { DailyChallengeModal } from "@/components/DailyChallengeModal";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import { VirtualJoystick } from "@/components/VirtualJoystick";
import { eventBus, EVENTS } from "@/lib/EventBus";
import { GuestStorage } from "@/lib/guestStorage";
import { CHARACTERS } from "@/data/characters";
import { SimRunStats } from "@/sim/Types";
import { Play, Sparkles, Trophy, Calendar, Zap, Shield, Flame, RotateCcw } from "lucide-react";

export default function GamePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameReady, setGameReady] = useState(false);
  const [characterId, setCharacterId] = useState("vanguard");
  const [arenaId, setArenaId] = useState("neon_orbit");

  // HUD State
  const [level, setLevel] = useState(1);
  const [currentXp, setCurrentXp] = useState(0);
  const [nextLevelXp, setNextLevelXp] = useState(5);
  const [timeSec, setTimeSec] = useState(0);
  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [combo, setCombo] = useState(0);

  // Modals
  const [levelUpChoices, setLevelUpChoices] = useState<string[] | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverStats, setGameOverStats] = useState<{ stats: SimRunStats; isVictory: boolean } | null>(null);
  const [showMetaShop, setShowMetaShop] = useState(false);
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const phaserGameRef = useRef<any>(null);

  // Listen to Phaser Events via EventBus
  useEffect(() => {
    const unsubReady = eventBus.on(EVENTS.GAME_READY, () => {
      setGameReady(true);
    });

    const unsubXp = eventBus.on(EVENTS.XP_UPDATED, (data) => {
      setLevel(data.level);
      setCurrentXp(data.currentXp);
      setNextLevelXp(data.nextLevelXp);
      setTimeSec(data.timeSec);
      setKills(data.kills);
      setScore(data.score);
      setHp(data.hp);
      setMaxHp(data.maxHp);
    });

    const unsubLevelUp = eventBus.on(EVENTS.LEVEL_UP, (data) => {
      setLevel(data.level);
      setLevelUpChoices(data.choices);
    });

    const unsubCombo = eventBus.on(EVENTS.COMBO_UPDATED, (data) => {
      setCombo(data.combo);
      setKills(data.kills);
      setScore(data.score);
    });

    const unsubGameOver = eventBus.on(EVENTS.RUN_COMPLETED, (data) => {
      setGameOverStats(data);
    });

    const unsubPause = eventBus.on(EVENTS.PAUSE_GAME, () => {
      setIsPaused(true);
    });

    return () => {
      unsubReady();
      unsubXp();
      unsubLevelUp();
      unsubCombo();
      unsubGameOver();
      unsubPause();
    };
  }, []);

  // Keyboard shortcut to Pause (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPlaying && !levelUpChoices && !gameOverStats) {
        if (isPaused) {
          setIsPaused(false);
          eventBus.emit(EVENTS.RESUME_GAME);
        } else {
          setIsPaused(true);
          eventBus.emit(EVENTS.PAUSE_GAME);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused, levelUpChoices, gameOverStats]);

  const handleStartGame = async (selectedSeed?: number) => {
    setIsPlaying(true);
    setGameOverStats(null);
    setLevelUpChoices(null);
    setIsPaused(false);

    // Dynamically boot Phaser on the client
    if (!phaserGameRef.current) {
      const { createStarfallGame } = await import("@/game/StarfallGame");
      phaserGameRef.current = createStarfallGame("phaser-canvas-container");
    } else {
      eventBus.emit(EVENTS.RESTART_RUN, {
        characterId,
        arenaId,
        seed: selectedSeed,
      });
    }
  };

  const handleSelectUpgrade = (upgradeId: string) => {
    setLevelUpChoices(null);
    eventBus.emit(EVENTS.SELECT_UPGRADE, { upgradeId });
  };

  const handleResume = () => {
    setIsPaused(false);
    eventBus.emit(EVENTS.RESUME_GAME);
  };

  const handleRestart = () => {
    setIsPaused(false);
    setGameOverStats(null);
    setLevelUpChoices(null);
    eventBus.emit(EVENTS.RESTART_RUN, { characterId, arenaId });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-cosmic-dark font-sans">
      {/* 1. Phaser Canvas Container */}
      <div id="phaser-canvas-container" className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Dynamic Mobile Touch Virtual Joystick */}
      {isPlaying && !isPaused && !levelUpChoices && !gameOverStats && <VirtualJoystick />}

      {/* 3. In-Game HUD Overlay */}
      {isPlaying && (
        <HUD
          level={level}
          currentXp={currentXp}
          nextLevelXp={nextLevelXp}
          timeSec={timeSec}
          kills={kills}
          score={score}
          hp={hp}
          maxHp={maxHp}
          combo={combo}
          onPause={() => {
            setIsPaused(true);
            eventBus.emit(EVENTS.PAUSE_GAME);
          }}
        />
      )}

      {/* 4. Start Screen (Before First Play) */}
      {!isPlaying && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 sm:p-12 bg-radial-gradient backdrop-blur-sm">
          {/* Top Title Banner */}
          <div className="flex flex-col items-center text-center mt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-cyan/10 border border-cosmic-cyan/40 text-cosmic-cyan text-xs font-black tracking-widest uppercase mb-3">
              <Zap className="w-3.5 h-3.5" />
              Cosmic Arcade Survivor v1.0
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cosmic-cyan via-white to-cosmic-magenta tracking-wider drop-shadow-[0_0_35px_rgba(0,240,255,0.5)]">
              STARFALL SURVIVORS
            </h1>
            <p className="text-sm sm:text-base text-gray-300 mt-2 max-w-lg">
              Move & dodge. Weapons fire automatically. Level up, evolve synergies, harvest Stardust, and conquer cosmic bosses.
            </p>
          </div>

          {/* Character Selector */}
          <div className="w-full max-w-xl flex flex-col items-center gap-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
              Select Starting Vessel:
            </span>
            <div className="grid grid-cols-3 gap-3 w-full">
              {Object.values(CHARACTERS).map((char) => (
                <button
                  key={char.id}
                  onClick={() => setCharacterId(char.id)}
                  className={`flex flex-col items-center p-3.5 rounded-xl border transition-all ${
                    characterId === char.id
                      ? "bg-cosmic-card border-cosmic-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-105"
                      : "bg-cosmic-card/60 border-cosmic-border hover:border-cosmic-cyan/50 opacity-80"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full mb-2 flex items-center justify-center font-black text-xs ${
                      char.id === "vanguard"
                        ? "bg-cosmic-cyan text-cosmic-dark"
                        : char.id === "reaver"
                        ? "bg-cosmic-purple text-white"
                        : "bg-cosmic-amber text-cosmic-dark"
                    }`}
                  >
                    {char.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-white text-center leading-tight">
                    {char.name}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 text-center line-clamp-1">
                    {char.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Instant Launch Button */}
            <button
              onClick={() => handleStartGame()}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-gradient-to-r from-cosmic-cyan via-cyan-400 to-cosmic-magenta text-cosmic-dark font-black text-lg tracking-widest uppercase flex items-center justify-center gap-3 transition transform hover:scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.6)]"
            >
              <Play className="w-5 h-5 fill-current" />
              PLAY NOW (SPACE / CLICK)
            </button>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMetaShop(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-card/90 hover:bg-cosmic-border border border-cosmic-border text-cosmic-amber text-xs font-bold uppercase tracking-wider transition"
            >
              <Sparkles className="w-4 h-4" />
              Meta Shipyard
            </button>

            <button
              onClick={() => setShowDailyChallenge(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-card/90 hover:bg-cosmic-border border border-cosmic-border text-cosmic-cyan text-xs font-bold uppercase tracking-wider transition"
            >
              <Calendar className="w-4 h-4" />
              Daily Challenge
            </button>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-card/90 hover:bg-cosmic-border border border-cosmic-border text-white text-xs font-bold uppercase tracking-wider transition"
            >
              <Trophy className="w-4 h-4 text-cosmic-purple" />
              Leaderboard
            </button>
          </div>
        </div>
      )}

      {/* 5. Level Up Modal (3 Upgrades) */}
      {levelUpChoices && (
        <UpgradeModal
          level={level}
          choices={levelUpChoices}
          onSelect={handleSelectUpgrade}
        />
      )}

      {/* 6. Pause Modal */}
      {isPaused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
        />
      )}

      {/* 7. Game Over / Victory Modal */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats.stats}
          isVictory={gameOverStats.isVictory}
          onRestart={handleRestart}
          onOpenMetaShop={() => {
            setGameOverStats(null);
            setShowMetaShop(true);
          }}
        />
      )}

      {/* 8. Meta Shop Modal */}
      {showMetaShop && (
        <MetaShopModal onClose={() => setShowMetaShop(false)} />
      )}

      {/* 9. Daily Challenge Modal */}
      {showDailyChallenge && (
        <DailyChallengeModal
          onClose={() => setShowDailyChallenge(false)}
          onStartDaily={(seed) => {
            setShowDailyChallenge(false);
            handleStartGame(seed);
          }}
        />
      )}

      {/* 10. Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </main>
  );
}
