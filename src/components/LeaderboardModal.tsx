"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Clock, Skull, X } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  durationMs: number;
  kills: number;
  characterId: string;
  arenaId: string;
}

interface LeaderboardModalProps {
  onClose: () => void;
}

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "all">("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [period]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] bg-cosmic-surface/95 border border-cosmic-border rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cosmic-border bg-cosmic-card/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cosmic-amber/10 border border-cosmic-amber/30 text-cosmic-amber">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Global Sector Leaderboard
              </h2>
              <p className="text-xs text-gray-400">Verified cosmic survivor high scores</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-cosmic-surface text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 bg-cosmic-surface border-b border-cosmic-border/60">
          {(["all", "weekly", "daily"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setPeriod(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                period === tab
                  ? "bg-cosmic-cyan text-cosmic-dark font-extrabold"
                  : "bg-cosmic-card text-gray-400 hover:text-white border border-cosmic-border"
              }`}
            >
              {tab === "all" ? "All Time" : tab === "weekly" ? "This Week" : "Today"}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-sm text-gray-400">
              <div className="w-6 h-6 border-2 border-cosmic-cyan border-t-transparent rounded-full animate-spin mb-3" />
              Retrieving global rankings...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No entries recorded for this timeframe yet. Be the first to claim rank #1!
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  entry.rank === 1
                    ? "bg-cosmic-amber/10 border-cosmic-amber/40 shadow-[0_0_15px_rgba(255,183,3,0.15)]"
                    : entry.rank === 2
                    ? "bg-cosmic-cyan/10 border-cosmic-cyan/40"
                    : entry.rank === 3
                    ? "bg-cosmic-purple/10 border-cosmic-purple/40"
                    : "bg-cosmic-card border-cosmic-border/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      entry.rank === 1
                        ? "bg-cosmic-amber text-cosmic-dark"
                        : entry.rank === 2
                        ? "bg-cosmic-cyan text-cosmic-dark"
                        : entry.rank === 3
                        ? "bg-cosmic-purple text-white"
                        : "bg-cosmic-surface text-gray-400"
                    }`}
                  >
                    #{entry.rank}
                  </span>

                  <div>
                    <h4 className="text-sm font-bold text-white">{entry.nickname}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cosmic-cyan" />
                        {formatTime(entry.durationMs)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Skull className="w-3 h-3 text-rose-400" />
                        {entry.kills}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-cosmic-amber">
                    {entry.score.toLocaleString()} PTS
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
