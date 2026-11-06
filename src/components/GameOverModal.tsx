"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Trophy, Skull, Clock, Sparkles, Send, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { SimRunStats } from "../sim/Types";
import { GuestStorage } from "../lib/guestStorage";

interface GameOverModalProps {
  stats: SimRunStats;
  isVictory: boolean;
  onRestart: () => void;
  onOpenMetaShop: () => void;
}

export function GameOverModal({ stats, isVictory, onRestart, onOpenMetaShop }: GameOverModalProps) {
  const [nickname, setNickname] = useState(() => GuestStorage.load().nickname || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#00f0ff", "#ff0077", "#ffb703", "#9d4edd"],
        });
      } catch {}
    }
  }, [isVictory]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || isSubmitting || submitSuccess) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Claim player nickname
      const playerRes = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (!playerRes.ok) {
        const err = await playerRes.json();
        throw new Error(err.error || "Failed to register nickname");
      }

      // Save nickname locally
      GuestStorage.update((s) => ({ ...s, nickname: nickname.trim() }));

      // 2. Submit run
      const runRes = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "standard",
          seed: 424242,
          characterId: "vanguard",
          arenaId: "neon_orbit",
          score: stats.score,
          durationMs: stats.durationMs,
          kills: stats.kills,
          levelReached: stats.levelReached,
          stardustEarned: stats.stardustEarned,
          buildJson: {
            weapons: stats.weaponsFinal,
            passives: stats.passivesFinal,
          },
        }),
      });

      if (!runRes.ok) {
        throw new Error("Failed to record score");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not submit score.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-fade-in">
      <div className="w-full max-w-lg bg-cosmic-surface/95 border border-cosmic-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Banner */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest mb-2 ${
              isVictory
                ? "bg-cosmic-amber/20 text-cosmic-amber border border-cosmic-amber/50"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {isVictory ? <Trophy className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
            {isVictory ? "VICTORY ACHIEVED" : "VESSEL DESTROYED"}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
            {isVictory ? "THE HARBINGER HAS FALLEN" : "MISSION FAILED"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {isVictory ? "Cosmic sector secured. Stardust harvested." : "Your ship was overwhelmed by cosmic forces."}
          </p>
        </div>

        {/* Core Run Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-6">
          <div className="flex flex-col items-center p-3 rounded-xl bg-cosmic-card border border-cosmic-border">
            <Clock className="w-4 h-4 text-cosmic-cyan mb-1" />
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Survived</span>
            <span className="text-base font-extrabold text-white">{formatTime(stats.durationMs)}</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-xl bg-cosmic-card border border-cosmic-border">
            <Skull className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Crushed</span>
            <span className="text-base font-extrabold text-white">{stats.kills.toLocaleString()}</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-xl bg-cosmic-card border border-cosmic-border">
            <Sparkles className="w-4 h-4 text-cosmic-amber mb-1" />
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Stardust</span>
            <span className="text-base font-extrabold text-cosmic-amber">+{stats.stardustEarned}</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-xl bg-cosmic-card border border-cosmic-border">
            <Trophy className="w-4 h-4 text-cosmic-purple mb-1" />
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Score</span>
            <span className="text-base font-extrabold text-white">{stats.score.toLocaleString()}</span>
          </div>
        </div>

        {/* Global Leaderboard Submission Form */}
        {!submitSuccess ? (
          <form onSubmit={handleSubmitScore} className="w-full flex flex-col gap-2 mb-6">
            <label className="text-xs font-bold text-gray-300">
              Submit to Global Leaderboard:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Nickname (e.g. StarPilot)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={16}
                className="flex-1 px-3 py-2 rounded-xl bg-cosmic-card border border-cosmic-border text-white text-sm focus:outline-none focus:border-cosmic-cyan"
              />
              <button
                type="submit"
                disabled={isSubmitting || !nickname.trim()}
                className="px-4 py-2 rounded-xl bg-cosmic-cyan hover:bg-cyan-400 disabled:opacity-50 text-cosmic-dark font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
            {errorMsg && <p className="text-[11px] text-rose-400 font-semibold">{errorMsg}</p>}
          </form>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 p-3 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Score submitted to Global Leaderboard!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-cosmic-cyan hover:bg-cyan-400 text-cosmic-dark font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(0,240,255,0.4)]"
          >
            <RotateCcw className="w-4 h-4" />
            One More Run
          </button>

          <button
            onClick={onOpenMetaShop}
            className="flex-1 py-3 px-4 rounded-xl bg-cosmic-card hover:bg-cosmic-border text-cosmic-amber font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition border border-cosmic-border"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Ship
          </button>
        </div>
      </div>
    </div>
  );
}
