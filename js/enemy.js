// enemy.js — Enemy definitions, spawning, and turn AI

// ── Enemy definitions ─────────────────────────────────────────────────────────
// Stats are base values at floor 1; they scale with floor number on creation.

const ENEMY_DEFS = {
    goblin:   { name: 'Goblin',   symbol: 'g', color: '#66bb6a', hp: 7,  atk: 3, def: 0, xp: 5,  range: 1, regen: 0 },
    orc:      { name: 'Orc',      symbol: 'O', color: '#ef5350', hp: 14, atk: 5, def: 1, xp: 10, range: 1, regen: 0 },
    skeleton: { name: 'Skeleton', symbol: 'S', color: '#fff9c4', hp: 10, atk: 6, def: 1, xp: 12, range: 2, regen: 0 },
    troll:    { name: 'Troll',    symbol: 'T', color: '#8d6e63', hp: 28, atk: 8, def: 3, xp: 20, range: 1, regen: 1 },
};

// Enemies available per floor depth
const FLOOR_POOL = [
    ['goblin', 'orc'],                        // floor 1
    ['goblin', 'orc', 'skeleton'],            // floor 2
    ['orc', 'skeleton', 'troll'],             // floor 3
    ['skeleton', 'troll'],                    // floor 4+
];

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a single enemy with stats scaled to the current floor.
 * Scaling is +20% per floor beyond floor 1 (capped at ×3).
 *
 * @param {string} type   key in ENEMY_DEFS
 * @param {number} x
 * @param {number} y
 * @param {number} floor  1-based floor index
 * @returns {object} enemy
 */
function createEnemy(type, x, y, floor) {
    const def   = ENEMY_DEFS[type];
    const scale = Math.min(3, 1 + (floor - 1) * 0.20);
    const hp    = Math.round(def.hp  * scale);

    return {
        type, x, y,
        name:   def.name,
        symbol: def.symbol,
        color:  def.color,
        hp,
        maxHp:  hp,
        atk:    Math.round(def.atk * scale),
        def:    def.def,
        xp:     def.xp + (floor - 1) * 2,
        range:  def.range,
        regen:  def.regen,
        aware:  false,   // set to true once player enters this enemy's FOV tile
    };
}

// ── Spawning ──────────────────────────────────────────────────────────────────

/**
 * Populate all rooms (except the starting room) with enemies.
 *
 * @param {Room[]}   rooms
 * @param {number}   floor
 * @param {Function} rng
 * @returns {object[]}
 */
function spawnEnemies(rooms, floor, rng) {
    const enemies = [];
    const poolIdx = Math.min(floor - 1, FLOOR_POOL.length - 1);
    const pool    = FLOOR_POOL[poolIdx];

    for (let i = 1; i < rooms.length; i++) {
        const room  = rooms[i];
        // 1 enemy guaranteed; +1 or +2 on deeper floors
        const count = 1 + Math.floor(rng() * Math.min(floor, 3));

        for (let j = 0; j < count; j++) {
            const pos  = room.randomInner(rng);
            // Don't stack enemies on the same tile
            if (enemies.find(e => e.x === pos.x && e.y === pos.y)) continue;

            const type = pool[Math.floor(rng() * pool.length)];
            enemies.push(createEnemy(type, pos.x, pos.y, floor));
        }
    }
    return enemies;
}

// ── AI ────────────────────────────────────────────────────────────────────────

/** Manhattan distance between two points. */
function dist(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Execute one AI turn for the given enemy.
 * Enemies become "aware" when the player's tile enters their FOV.
 * Once aware, they pursue and attack.  Trolls regenerate 1 HP/turn.
 *
 * @param {object} enemy
 * @param {object} gameState  { player, dungeon, enemies, messages }
 */
function moveEnemy(enemy, gameState) {
    const { player, dungeon, enemies, messages } = gameState;

    // Troll passive regeneration
    if (enemy.regen > 0 && enemy.hp < enemy.maxHp) {
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.regen);
    }

    // Become aware when the player is visible from this tile
    if (dungeon.fov[enemy.y][enemy.x].visible) {
        enemy.aware = true;
    }
    if (!enemy.aware) return;

    const d = dist(enemy.x, enemy.y, player.x, player.y);

    // Attack if within range
    if (d <= enemy.range) {
        enemyAttack(enemy, player, messages);
        return;
    }

    // Move toward the player — try primary axis first, then secondary
    const dx = Math.sign(player.x - enemy.x);
    const dy = Math.sign(player.y - enemy.y);

    // Candidate moves ordered by preference (closer axis first)
    const moves = Math.abs(player.x - enemy.x) >= Math.abs(player.y - enemy.y)
        ? [[dx, 0], [0, dy], [0, -dy], [-dx, 0]]
        : [[0, dy], [dx, 0], [-dx, 0], [0, -dy]];

    for (const [mx, my] of moves) {
        const nx = enemy.x + mx;
        const ny = enemy.y + my;
        if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;
        if (dungeon.tiles[ny][nx] === TILE.WALL) continue;

        // Don't walk into the player — attack instead
        if (nx === player.x && ny === player.y) {
            enemyAttack(enemy, player, messages);
            return;
        }

        // Don't stack on another living enemy
        if (enemies.find(e => e !== enemy && e.hp > 0 && e.x === nx && e.y === ny)) continue;

        enemy.x = nx;
        enemy.y = ny;
        return;
    }
}
