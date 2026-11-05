# Starfall Survivors — Manual Playtest & Quality Bar Checklist (PLAYTEST.md)

This 20-item checklist defines the acceptance criteria for gameplay feel, fairness, readability, performance, and cross-platform compatibility across desktop and mobile devices.

---

## 1. First 30 Seconds & "Juice" Feedback

- [ ] **1. Instant First Action (< 5s)**: Player can load the page and start moving within 5 seconds without mandatory account creation or intrusive splash screens.
- [ ] **2. Instant Gem Drop Feedback**: First destroyed enemy drops a glowing XP gem with an immediate magnet drift toward the player.
- [ ] **3. Rapid First Level-Up (< 25s)**: First level-up card selection occurs within the first 25 seconds of gameplay.
- [ ] **4. Hit-Stop & Impact Crunch**: Landing hits on high-HP enemies produces micro hit-stop (~30-50ms) and enemy flash.
- [ ] **5. Screen Shake Intensity**: Weapon discharges and explosions trigger screen shake that respects the player's intensity slider in Settings (0% to 100%).
- [ ] **6. Floating Damage Numbers**: Critical hits display distinctly (larger font, yellow/amber glow) compared to standard cyan damage numbers.
- [ ] **7. Combo Escalator**: Continuous kills without taking damage ramp up an escalating pitch chime on XP gem pickups.
- [ ] **8. Level-Up Slow Motion**: Triggering a level-up eases the game speed to 10% before presenting the 3-choice upgrade modal.

---

## 2. Pacing, Difficulty & Readability

- [ ] **9. Strict Visual Hierarchy**: Player ship and player projectiles always render with highest contrast against hazards, enemies, pickups, and background nebula.
- [ ] **10. Distinct Hazard Telegraphs**: Boss laser beams and enemy charger rushes show readable wind-up telegraphs (> 750ms).
- [ ] **11. Guaranteed Breathing Room**: Waves include periodic 10-15s breathing room intervals to allow players to gather gems.
- [ ] **12. Meaningful Upgrade Synergies**: Every weapon has a clear evolved synergy when paired with its designated passive item.
- [ ] **13. Satisfying Death Screen**: Death modal clearly displays time survived, enemies crushed, Stardust earned, and actionable "What to try next" tips.

---

## 3. Controls & Cross-Device Matrix

- [ ] **14. Desktop Controls (WASD & Arrows)**: Responsive 8-directional movement with sub-50ms input latency.
- [ ] **15. Mobile Floating Touch Joystick**: Left-thumb touch dynamically anchors the virtual joystick origin, adapting to any hand size.
- [ ] **16. Mobile Safe-Area Insets**: HUD elements and virtual joystick do not overlap iPhone Dynamic Island/notches or Android navigation bars.
- [ ] **17. Locked 60 FPS Target**: Mid-range smartphone (e.g., Pixel 5 or iPhone 11) maintains >= 55 FPS during high-density waves.
- [ ] **18. Adaptive Quality Fallback**: If FPS drops below 50, particle counts auto-halve and background shaders simplify without interrupting gameplay.

---

## 4. Accessibility & Audio Polish

- [ ] **19. Photosensitivity & Reduced Motion**: Reduced Flash and Reduced Motion modes fully eliminate screen shake and strobing white flashes.
- [ ] **20. Audio Controls & Tab Blur**: Background music and SFX mute cleanly when tab loses focus, and resume seamlessly upon focus return.
