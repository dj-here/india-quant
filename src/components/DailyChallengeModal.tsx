"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Zap, Play, X, ShieldAlert } from "lucide-react";
import { DailyModifierDef } from "../data/dailyModifiers";

interface DailyChallengeModalProps {
  onClose: () => void;
  onStartDaily: (seed: number) => void;
}

export function DailyChallengeModal({ onClose, onStartDaily }: DailyChallengeModalProps) {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<{ date: string; seed: number; modifiers: DailyModifierDef[] } | null>(null);

  useEffect(() => {
    fetch("/api/daily")
      .then((res) => res.json())
      .then((data) => {
        setDailyData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-cosmic-surface/95 border border-cosmic-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cosmic-cyan/10 border border-cosmic-cyan/30 text-cosmic-cyan">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Daily Galactic Challenge
              </h2>
              <p className="text-xs text-gray-400">One ranked attempt every UTC day</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-cosmic-card text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-sm text-gray-400">
            <div className="w-6 h-6 border-2 border-cosmic-cyan border-t-transparent rounded-full animate-spin mb-3" />
            Calculating celestial planetary alignment...
          </div>
        ) : dailyData ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-cosmic-card border border-cosmic-border text-xs font-bold text-gray-300">
              <span>Date: {dailyData.date}</span>
              <span className="text-cosmic-cyan font-mono">Seed: #{dailyData.seed % 100000}</span>
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-cosmic-amber mb-2">
                Active Cosmic Modifiers:
              </h3>
              <div className="flex flex-col gap-2.5">
                {dailyData.modifiers.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-3.5 rounded-xl bg-cosmic-card border border-cosmic-border/80 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-cosmic-amber/10 text-cosmic-amber mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{mod.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onStartDaily(dailyData.seed)}
              className="mt-2 w-full py-3.5 px-4 rounded-xl bg-cosmic-cyan hover:bg-cyan-400 text-cosmic-dark font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Daily Mission
            </button>
          </div>
        ) : (
          <div className="text-sm text-rose-400 text-center py-6">
            Unable to connect to daily challenge telemetry.
          </div>
        )}
      </div>
    </div>
  );
}
