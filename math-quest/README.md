# 🎮 Math Quest — a 3D Math Adventure

A colorful, fully-playable 3D adventure game that teaches math to ~10-year-olds.
Explore a world, solve challenges, battle monsters, race rivals, defeat bosses,
earn coins/XP/stars/badges, and unlock new zones — all powered by an **adaptive
math engine** that finds each player's "sweet spot."

Built with **Three.js** (vendored locally), plain JavaScript, the Web Audio API
(all sounds generated at runtime — no audio files), and `localStorage` for saves.
No build step, no server required, no paid APIs, works fully **offline**.

---

## ▶ How to run

**Option A — just open it (offline, zero setup):**

Double-click `math-quest/index.html`, or open it in any modern browser
(Chrome, Edge, Firefox, Safari). That's it — the game starts.

**Option B — serve it locally** (recommended for phones/tablets on your network):

```bash
cd math-quest
python3 -m http.server 8080
# then visit http://localhost:8080
```

or with Node:

```bash
npx serve math-quest
```

Everything Math Quest needs (including Three.js in `./vendor/`) ships with the
folder, so it runs without an internet connection.

---

## 🎯 Controls

| Action        | Keyboard / Mouse            | Touch                     |
|---------------|-----------------------------|---------------------------|
| Move          | `W A S D` or Arrow keys     | Left on-screen joystick   |
| Interact      | `E`                         | Big yellow **ACT** button |
| Menu          | `M`                         | ☰ button (top-right)      |
| World Map     | —                           | 🗺️ button (top-right)     |
| Close / Back  | `Esc`                       | ✕ on any panel            |

Walk up to a glowing **✨ crystal**, **💎 chest**, **👾 monster**, **🏎️ race gate**,
or **👑 boss** and interact to start a math encounter.

---

## 1. What's implemented

**World & exploration**
- A real-time 3D world with 5 themed zones on floating islands linked by bridges:
  🌳 Math Forest · 🏰 Multiplication Castle · 🏜️ Fraction Desert ·
  🚀 Geometry Space Station · 🏙️ Logic City.
- Third-person character (4 selectable heroes) with smooth movement, follow-camera,
  procedural decorations, a starfield, shadows, and fog.
- Locked zones are **visible** behind translucent domes showing the ⭐ cost, so kids
  can see what they're working toward. Unlock by earning stars, then the zone fills
  with challenges and a boss.
- Instant travel from the 🗺️ World Map to any unlocked zone.

**Math curriculum** (22 generators, each scaling across 10 difficulty steps)
- Arithmetic: addition, subtraction, multiplication, division, mental math
- Fractions: recognizing, comparing (with pie visuals), same-denominator add/subtract
- Decimals: add, subtract, multiply, compare
- Geometry: shapes, angles, perimeter, area, volume, symmetry (all with SVG visuals)
- Word problems: money, time, distance, speed, measurement, everyday situations
- Logic: number patterns, missing numbers, sequences, odd/even reasoning

**Mini-games**
- ⚔️ **Math Battle** — trade blows with a monster; correct answers deal damage.
- 👑 **Boss Battle** — 100-HP zone boss, 6 escalating questions, big rewards + ⭐⭐⭐.
- 🏎️ **Math Race** — beat a rival to the finish; fast correct answers = speed boost.
- 💎 **Treasure Hunt** — chests in the world unlock with a question for bonus loot.
- 📅 **Daily Challenge** — 10 escalating questions, tracks your personal best.
- 🧠 **Practice** — pressure-free, every topic, learn from hints.

**Progression & rewards**
- 🪙 Coins, ⚡ XP with level-ups, ⭐ Stars (gate zone unlocks), 🏅 Achievement badges.
- 🔥 Streak system with escalating bonuses at 3 / 5 / 10 correct — never punishing.
- 🛍️ Cosmetic shop: skins, a wizard hat, and a pet — all earned, **no purchases,
  no loot boxes, no gambling**. Equipped items appear on your 3D character.

**Learning-first feedback**
- Wrong answers never say just "Wrong!" — they show a **hint** (and reveal the
  answer after a second miss) so the player learns, then try again.
- Optional voice read-aloud for questions and feedback.

**Parent / teacher dashboard** (PIN-protected, default **1234**, changeable)
- Questions answered, overall accuracy, average response time, strongest and
  weakest topics, per-category mastery bars, and recent mistakes.

**Accessibility & settings**
- Independent music / SFX toggles, adjustable text size, high-contrast mode,
  voice read-aloud, no time pressure in Practice, full keyboard **and** touch support,
  and a reset-progress option.

**Persistence** — everything (level, coins, stars, cosmetics, unlocks, bosses,
stats, daily best) saves automatically to `localStorage`.

---

## 2. How the adaptive difficulty works

Each of the 22 categories carries its own difficulty value (1–10) stored per player:

- **Correct & fast** (< 6 s) → difficulty rises noticeably (+0.6).
- **Correct & slow** → difficulty rises gently (+0.3).
- **Incorrect** → difficulty eases back (−0.7) and a hint is offered.

The chosen **difficulty tier** (Explorer / Challenger / Master) sets a *floor* so a
child never drops below their level, while the per-category value keeps hunting for
the point where questions are hard-but-achievable. Boss fights temporarily ramp the
difficulty question-by-question for a real climax. Recently-seen questions are tracked
to avoid immediate repeats.

Every generator is verified: an automated pass exercised **8,800 generated questions**
(22 categories × 10 difficulties) confirming the correct answer is always present,
there are always enough distinct options, and all arithmetic is mathematically correct.

---

## 3. Code layout

Single self-contained file: [`index.html`](./index.html), organized into clearly
commented systems — persistence, audio engine, math engine, 3D world, player &
movement, rewards/streaks, HUD, and each menu / mini-game. Three.js is vendored at
[`vendor/three.module.js`](./vendor/three.module.js) so nothing loads from the network.

---

## 4. What could come next

- Networked friend leaderboards for the Daily Challenge.
- More cosmetic sets and a small "home base" to show them off.
- Additional mini-games (memory match, tower defense with math ammo).
- Spoken step-by-step worked solutions after a second miss.
- More granular curriculum reports and printable progress for teachers.

Enjoy the quest! 🚀
