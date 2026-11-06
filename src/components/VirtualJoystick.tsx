"use client";

import React, { useState, useRef, useEffect } from "react";
import { eventBus } from "../lib/EventBus";

export function VirtualJoystick() {
  const [touchActive, setTouchActive] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxRadius = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Left-half of screen only
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth / 2) return;

    setOrigin({ x: touch.clientX, y: touch.clientY });
    setCurrent({ x: touch.clientX, y: touch.clientY });
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!origin || !touchActive) return;
    const touch = e.touches[0];

    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      const angle = Math.atan2(dy, dx);
      setCurrent({
        x: origin.x + Math.cos(angle) * maxRadius,
        y: origin.y + Math.sin(angle) * maxRadius,
      });
      eventBus.emit("JOYSTICK_MOVE", {
        dx: Math.cos(angle),
        dy: Math.sin(angle),
      });
    } else {
      setCurrent({ x: touch.clientX, y: touch.clientY });
      eventBus.emit("JOYSTICK_MOVE", {
        dx: dx / maxRadius,
        dy: dy / maxRadius,
      });
    }
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    setOrigin(null);
    setCurrent(null);
    eventBus.emit("JOYSTICK_MOVE", { dx: 0, dy: 0 });
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="absolute inset-0 z-20 pointer-events-auto sm:hidden select-none touch-none"
    >
      {touchActive && origin && current && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cosmic-cyan/40 bg-cosmic-cyan/10 pointer-events-none"
          style={{
            left: origin.x,
            top: origin.y,
            width: maxRadius * 2,
            height: maxRadius * 2,
          }}
        >
          {/* Thumb stick */}
          <div
            className="absolute rounded-full bg-cosmic-cyan shadow-[0_0_15px_rgba(0,240,255,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: current.x - origin.x + maxRadius,
              top: current.y - origin.y + maxRadius,
              width: 38,
              height: 38,
            }}
          />
        </div>
      )}
    </div>
  );
}
