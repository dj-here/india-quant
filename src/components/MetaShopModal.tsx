"use client";

import React, { useState } from "react";
import { META_TREE_NODES, MetaNodeDef } from "../data/metaTree";
import { GuestStorage } from "../lib/guestStorage";
import { Sparkles, X, Shield, Flame, Compass, Crown, Check } from "lucide-react";

interface MetaShopModalProps {
  onClose: () => void;
}

export function MetaShopModal({ onClose }: MetaShopModalProps) {
  const [saveData, setSaveData] = useState(() => GuestStorage.load());
  const [selectedCategory, setSelectedCategory] = useState<"all" | "offense" | "defense" | "utility" | "special">("all");

  const handlePurchase = (node: MetaNodeDef) => {
    const currentRank = saveData.metaTreeRanks[node.id] || 0;
    if (currentRank >= node.maxRank) return;

    const cost = Math.round(node.baseCost * Math.pow(node.costMultiplier, currentRank));
    if (saveData.stardust < cost) return;

    const success = GuestStorage.purchaseMetaRank(node.id, cost);
    if (success) {
      setSaveData(GuestStorage.load());
    }
  };

  const filteredNodes = META_TREE_NODES.filter((n) => {
    if (selectedCategory === "all") return true;
    return n.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] bg-cosmic-surface/95 border border-cosmic-border rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cosmic-border bg-cosmic-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cosmic-amber/10 border border-cosmic-amber/30 text-cosmic-amber">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide uppercase">
                Shipyard Engineering Matrix
              </h2>
              <p className="text-xs text-gray-400">Permanent meta-progression skill tree</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cosmic-surface border border-cosmic-amber/40 text-cosmic-amber font-extrabold text-sm">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{saveData.stardust.toLocaleString()} Stardust</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-cosmic-surface hover:bg-cosmic-border text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 p-3 bg-cosmic-surface border-b border-cosmic-border/60 overflow-x-auto">
          {[
            { id: "all", label: "All Nodes" },
            { id: "offense", label: "Offense" },
            { id: "defense", label: "Defense" },
            { id: "utility", label: "Utility" },
            { id: "special", label: "Mastery" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                selectedCategory === cat.id
                  ? "bg-cosmic-cyan text-cosmic-dark font-extrabold"
                  : "bg-cosmic-card text-gray-400 hover:text-white border border-cosmic-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nodes Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
            const currentRank = saveData.metaTreeRanks[node.id] || 0;
            const isMaxed = currentRank >= node.maxRank;
            const cost = Math.round(node.baseCost * Math.pow(node.costMultiplier, currentRank));
            const canAfford = saveData.stardust >= cost && !isMaxed;

            // Check prerequisite
            const meetsPrereq = !node.requiresNodeId || (saveData.metaTreeRanks[node.requiresNodeId] || 0) > 0;

            return (
              <div
                key={node.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  isMaxed
                    ? "bg-cosmic-card/40 border-cosmic-cyan/30"
                    : !meetsPrereq
                    ? "bg-cosmic-card/20 border-cosmic-border/40 opacity-50"
                    : "bg-cosmic-card/90 border-cosmic-border hover:border-cosmic-cyan/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cosmic-cyan">
                      {node.category}
                    </span>
                    <span className="text-xs font-bold text-gray-300">
                      Rank {currentRank} / {node.maxRank}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1.5">{node.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{node.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-cosmic-border/40 flex items-center justify-between">
                  {isMaxed ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-cosmic-cyan">
                      <Check className="w-4 h-4" />
                      MAX LEVEL
                    </div>
                  ) : !meetsPrereq ? (
                    <span className="text-[11px] text-gray-500 font-semibold">Locked by Parent</span>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-xs font-extrabold text-cosmic-amber">
                        <Sparkles className="w-3.5 h-3.5" />
                        {cost.toLocaleString()}
                      </div>

                      <button
                        onClick={() => handlePurchase(node)}
                        disabled={!canAfford}
                        className="px-3 py-1.5 rounded-lg bg-cosmic-cyan hover:bg-cyan-400 disabled:opacity-40 text-cosmic-dark font-extrabold text-xs uppercase tracking-wider transition"
                      >
                        Upgrade
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
