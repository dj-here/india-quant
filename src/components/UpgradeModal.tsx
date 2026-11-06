"use client";

import React, { useEffect } from "react";
import { WEAPONS } from "../data/weapons";
import { PASSIVES } from "../data/passives";
import { Zap, Sparkles, Flame, Shield, ArrowUpRight } from "lucide-react";

interface UpgradeModalProps {
  level: number;
  choices: string[];
  onSelect: (upgradeId: string) => void;
}

export function UpgradeModal({ level, choices, onSelect }: UpgradeModalProps) {
  // Keyboard shortcuts (1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1" && choices[0]) onSelect(choices[0]);
      if (e.key === "2" && choices[1]) onSelect(choices[1]);
      if (e.key === "3" && choices[2]) onSelect(choices[2]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [choices, onSelect]);

  const getUpgradeDetails = (id: string) => {
    if (WEAPONS[id]) {
      const w = WEAPONS[id];
      return {
        title: w.name,
        type: "WEAPON" as const,
        description: w.description,
        color: w.color,
        evolution: w.evolution,
      };
    }
    if (PASSIVES[id]) {
      const p = PASSIVES[id];
      return {
        title: p.name,
        type: "PASSIVE" as const,
        description: p.description,
        color: "#9d4edd",
        evolution: undefined,
      };
    }
    return {
      title: "Cosmic Capacitor",
      type: "UPGRADE" as const,
      description: "Enhances ship capabilities.",
      color: "#00f0ff",
      evolution: undefined,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-cosmic-surface/95 border border-cosmic-cyan/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cosmic-cyan/10 border border-cosmic-cyan/30 text-cosmic-cyan text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Level Up Reached!
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            CHOOSE YOUR UPGRADE (LVL {level})
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Press [1], [2], [3] or tap a card to install
          </p>
        </div>

        {/* 3 Choices Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {choices.map((choiceId, idx) => {
            const item = getUpgradeDetails(choiceId);
            return (
              <button
                key={choiceId}
                onClick={() => onSelect(choiceId)}
                className="group relative flex flex-col items-start justify-between p-5 bg-cosmic-card/90 hover:bg-cosmic-card border border-cosmic-border hover:border-cosmic-cyan rounded-xl transition-all duration-150 transform hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,240,255,0.35)] text-left"
              >
                {/* Hotkey Tag */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-md bg-cosmic-surface border border-cosmic-border flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-cosmic-cyan group-hover:border-cosmic-cyan">
                  {idx + 1}
                </div>

                <div>
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      border: `1px solid ${item.color}50`,
                    }}
                  >
                    {item.type}
                  </span>

                  <h3 className="text-base sm:text-lg font-bold text-white mt-2 group-hover:text-cosmic-cyan transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-300 mt-2 line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {item.evolution && (
                  <div className="mt-4 pt-3 border-t border-cosmic-border/60 w-full flex items-center justify-between text-[10px] font-bold text-cosmic-amber">
                    <span>Evolves into {item.evolution.evolvedName}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
