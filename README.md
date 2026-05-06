# Dungeon Crawler

A browser-based roguelike dungeon crawler built with pure HTML5/CSS/JavaScript. No installation required — open `index.html` and play.

Every run is different. Descend into procedurally generated dungeons, fight enemies, collect gear, and see how deep you can go.

---

## Screenshot

> _Add a screenshot here after your first playthrough._

---

## Gameplay

You play as `@`, a lone adventurer exploring an endless dungeon. Each floor is randomly generated using a **Binary Space Partitioning (BSP)** algorithm that creates natural-looking rooms connected by corridors.

The game is **turn-based** — you act, then all enemies act. Use terrain and your equipment wisely.

### Goal
Descend as many floors as possible. There is no final boss — survive as long as you can.

### Win / Lose
- **Die**: your HP drops to 0. The game shows your final floor and level.
- **Restart**: press `Enter` at any time to start a fresh run.

---

## Features

| Feature | Details |
|---|---|
| Procedural dungeons | BSP algorithm — unique layout every run |
| Fog of war | Unexplored tiles hidden; explored-but-dark tiles dimmed |
| Turn-based combat | Player acts, then all enemies act |
| 4 enemy types | Goblin, Orc, Skeleton (ranged), Troll (regenerates HP) |
| Item system | Weapons (3 tiers), Armor (3 tiers), Potions, Lightning Scrolls |
| Level-up system | Gain XP from kills; level-up increases ATK and max HP |
| Scaling difficulty | Enemies stat-scale with floor depth |
| Color UI | Dark retro palette with per-entity HP bars and scrolling message log |

---

## How to Run

1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox)
3. Press `Enter` to start

No server, no build step, no dependencies.

```
git clone https://github.com/bzmull/ClaudeCode_test.git
cd ClaudeCode_test
# Open index.html in your browser
```

---

## Controls

| Key | Action |
|---|---|
| `↑ ↓ ← →` or `W A S D` | Move / bump-attack |
| `>` or `.` | Descend stairs (when standing on `>`) |
| `U` | Drink a potion |
| `Z` | Use a Lightning Scroll |
| `Enter` | New game (from title or game-over screen) |

**Tip:** Walking into an enemy automatically attacks it.

---

## Enemies

| Symbol | Name | Notes |
|---|---|---|
| `g` | Goblin | Weak but common on early floors |
| `O` | Orc | Balanced threat |
| `S` | Skeleton | Attacks from 2 tiles away |
| `T` | Troll | High HP, regenerates 1 HP/turn |

All enemies scale in stats with floor depth (+20% per floor, capped at ×3).

---

## Items

| Symbol | Item | Effect |
|---|---|---|
| `!` | Potion (S/M/L) | Restores 10 / 22 / 38 HP |
| `/` | Short / Long / Enchanted Sword | +2 / +4 / +7 ATK |
| `]` | Leather / Chainmail / Plate | +2 / +4 / +7 DEF |
| `?` | Lightning Scroll | 15–25 damage to all visible enemies |

Items are **auto-picked up** when you walk over them. Better gear auto-equips; weaker gear is noted in the log.

---

## Tech Stack

- **Language**: Vanilla JavaScript (ES6+)
- **Rendering**: HTML5 Canvas
- **UI**: HTML/CSS DOM sidebar
- **No dependencies**: zero npm packages, zero build tools
- **Entry point**: `index.html` (double-click to play)

---

## Project Structure

```
ClaudeCode_test/
├── index.html          # Game shell — loads all scripts in order
├── README.md
├── .gitignore
├── css/
│   └── style.css       # Layout, dark theme, sidebar styling
└── js/
    ├── dungeon.js      # BSP dungeon generation + shared constants (TILE, MAP_W/H)
    ├── fov.js          # Bresenham line-of-sight / fog-of-war
    ├── items.js        # Item catalogue, ground spawning, pickup & use logic
    ├── player.js       # Player creation, stat getters, XP & level-up
    ├── enemy.js        # Enemy types, floor spawning, turn AI
    ├── combat.js       # Damage calculation, player/enemy attack functions
    ├── renderer.js     # Canvas tile, entity, and HP-bar drawing
    ├── ui.js           # DOM sidebar: stats, inventory, message log, overlay
    └── main.js         # Game state, input handling, turn loop, floor transitions
```

---

## Roadmap

Potential future features:

- [ ] Mini-map in the sidebar
- [ ] More enemy types (mage, dragon)
- [ ] Ranged weapons (bow, throwing knives)
- [ ] Status effects (poison, slow, burn)
- [ ] Boss floors every 5 levels
- [ ] High-score persistence via `localStorage`
- [ ] Sound effects
- [ ] Mobile touch controls

---

## Contributing

Contributions welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please keep PRs focused — one feature or fix per PR.

---

## License

[MIT](https://opensource.org/licenses/MIT) — free to use, modify, and distribute.
