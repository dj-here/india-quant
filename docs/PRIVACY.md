# Starfall Survivors — Privacy Policy & Terms (PRIVACY.md)

**Effective Date:** November 5, 2026  
**Product:** Starfall Survivors (Web & Mobile Browser Arcade)

---

## 1. Privacy Principles & Minimal Data Collection

Starfall Survivors is committed to zero manipulative practices and absolute data minimization:
1. **No Personal Data Required**: You do not need to register an email address, phone number, password, or real name to play.
2. **Anonymous Nicknames Only**: If you choose to submit scores to the public leaderboard, you provide only a self-selected display nickname (moderated by an automated profanity filter).
3. **No Third-Party Ad Trackers**: We do not sell data, load Google Ads, or embed Facebook tracking pixels.
4. **First-Party Analytics Only**: We may measure performance via privacy-friendly Vercel Speed Insights (aggregating Web Vitals with zero persistent tracking cookies).

---

## 2. Storage & Cookie Usage

- **Local Storage / IndexedDB**: Used strictly to store game save data (unlocked ships, earned Stardust, settings preferences) on your local device.
- **Session Cookie (`token`)**: An anonymous cryptographically signed session token (HMAC-SHA256) used solely to prevent leaderboard request forgery and rate limit abuse.

---

## 3. Data Deletion & Player Autonomy

You have total control over your game data:
- **Client-Side Reset**: Open in-game **Settings -> Data Management -> Reset All Progress** to wipe all local storage and IndexedDB entries immediately.
- **Server-Side Deletion**: Send a `POST` request to `/api/player/delete` with your session cookie to purge your nickname, save records, and leaderboard submissions from the Neon database.

---

## 4. Fair Play & Terms of Service

1. **Cheating & Exploits**: Submitting mathematically impossible scores, tampering with client memory to manipulate game logs, or flooding API endpoints will result in automatic leaderboard flagging and removal.
2. **Acceptable Nicknames**: Offensive, hateful, or abusive nicknames are prohibited and will be redacted or removed without notice.
3. **As-Is Provision**: Starfall Survivors is provided free of charge for entertainment purposes.
