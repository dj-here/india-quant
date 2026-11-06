"use client";

import React, { useState } from "react";
import { Play, RotateCcw, Volume2, ShieldCheck, EyeOff } from "lucide-react";
import { GuestStorage } from "../lib/guestStorage";
import { soundEngine } from "../game/audio/SoundEngine";
import { musicSynthesizer } from "../game/audio/MusicSynthesizer";

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
}

export function PauseModal({ onResume, onRestart }: PauseModalProps) {
  const [settings, setSettings] = useState(() => GuestStorage.load().settings);

  const handleVolumeChange = (type: "master" | "sfx" | "music", val: number) => {
    const updated = {
      ...settings,
      [`${type}Volume`]: val,
    };
    setSettings(updated);
    GuestStorage.update((s) => ({ ...s, settings: updated }));

    if (type === "master" || type === "sfx") {
      soundEngine.setVolume(updated.masterVolume, updated.sfxVolume);
    }
    if (type === "music") {
      musicSynthesizer.setVolume(updated.musicVolume);
    }
  };

  const handleToggleMotion = () => {
    const updated = { ...settings, reducedMotion: !settings.reducedMotion };
    setSettings(updated);
    GuestStorage.update((s) => ({ ...s, settings: updated }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-cosmic-surface/95 border border-cosmic-border rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">
            SYSTEM PAUSED
          </h2>
          <p className="text-xs text-gray-400 mt-1">Telemetry frozen</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-cosmic-cyan hover:bg-cyan-400 text-cosmic-dark font-extrabold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Flight (Esc)
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-cosmic-card hover:bg-cosmic-border text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition border border-cosmic-border"
          >
            <RotateCcw className="w-4 h-4" />
            Instant Restart
          </button>
        </div>

        {/* Audio & Accessibility Controls */}
        <div className="flex flex-col gap-4 border-t border-cosmic-border/60 pt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cosmic-cyan" />
              Master Volume
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => handleVolumeChange("master", parseFloat(e.target.value))}
              className="w-32 accent-cosmic-cyan cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span>SFX Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleVolumeChange("sfx", parseFloat(e.target.value))}
              className="w-32 accent-cosmic-cyan cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
            <span>Music Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleVolumeChange("music", parseFloat(e.target.value))}
              className="w-32 accent-cosmic-cyan cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-gray-300 pt-2 border-t border-cosmic-border/40">
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-cosmic-purple" />
              Reduced Motion & Flashes
            </span>
            <button
              onClick={handleToggleMotion}
              className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition ${
                settings.reducedMotion
                  ? "bg-cosmic-cyan text-cosmic-dark"
                  : "bg-cosmic-card text-gray-400 border border-cosmic-border"
              }`}
            >
              {settings.reducedMotion ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
