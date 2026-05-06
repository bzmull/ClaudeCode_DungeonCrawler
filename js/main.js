// main.js — Game orchestration: state, input handling, and turn processing

// ── Game state ────────────────────────────────────────────────────────────────

let GS = null;   // single mutable game-state object

// ── Initialisation ────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    canvas.width  = MAP_W * TILE_SIZE;
    canvas.height = MAP_H * TILE_SIZE;
    GS = buildState(canvas, canvas.getContext('2d'), 1, null);
    GS.status = 'title';   // hold on title screen until Enter is pressed
    redraw();
    showOverlay(true, {
        title: 'DUNGEON CRAWLER',
        stats: ['Descend as far as you can.', 'Defeat enemies. Collect gear. Survive.'],
        hint:  'PRESS ENTER TO BEGIN',
    });
});

/**
 * Build a complete game state object for the given floor.
 * Carries the player object across floors (preserving level/inventory).
 *
 * @param {HTMLCanvasElement}       canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}                  floor   1-based
 * @param {object|null}             player  existing player (null = new game)
 * @param {string[]}                prevLog prior messages to preserve
 * @returns {object}
 */
function buildState(canvas, ctx, floor, player, prevLog = []) {
    const dungeon  = generateDungeon(floor);
    const start    = dungeon.rooms[0];

    if (!player) {
        player = createPlayer(start.cx, start.cy);
    } else {
        player.x = start.cx;
        player.y = start.cy;
    }

    const enemies  = spawnEnemies(dungeon.rooms, floor, dungeon.rng);
    const items    = spawnItems(dungeon.rooms, floor, dungeon.rng);
    const messages = floor === 1
        ? ['[sys] Welcome, adventurer. Descend and survive.']
        : [`[sys] You descend to floor ${floor}...`, ...prevLog.slice(0, 20)];

    computeFOV(dungeon, player.x, player.y);

    return { canvas, ctx, dungeon, player, enemies, items, floor, messages, status: 'playing' };
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function redraw() {
    render(GS.canvas, GS.ctx, GS);
    updateUI(GS);
}

// ── Input handling ────────────────────────────────────────────────────────────

window.addEventListener('keydown', (e) => {
    // Prevent arrow keys from scrolling the page
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    if (!GS || GS.status !== 'playing') {
        if (e.key === 'Enter') startNewGame();
        return;
    }

    let acted = false;

    switch (e.key) {
        // Movement / attack
        case 'ArrowUp':    case 'w': case 'W': acted = playerMove( 0, -1); break;
        case 'ArrowDown':  case 's': case 'S': acted = playerMove( 0,  1); break;
        case 'ArrowLeft':  case 'a': case 'A': acted = playerMove(-1,  0); break;
        case 'ArrowRight': case 'd': case 'D': acted = playerMove( 1,  0); break;

        // Consumables
        case 'u': case 'U': acted = usePotion(GS.player, GS.messages);  break;
        case 'z': case 'Z': acted = useScroll(GS.player, GS.enemies, GS.dungeon, GS.messages); break;

        // Descend stairs (> key, or period for US keyboards)
        case '>': case '.':
            if (GS.dungeon.tiles[GS.player.y][GS.player.x] === TILE.STAIRS) {
                descendStairs();
                return;
            }
            break;
    }

    if (acted) endTurn();
});

// ── Player turn ───────────────────────────────────────────────────────────────

/**
 * Attempt to move the player by (dx, dy).
 * If the destination holds an enemy, attack instead.
 * Returns true if the action consumed a turn.
 */
function playerMove(dx, dy) {
    const { player, dungeon, enemies, items, messages } = GS;
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) return false;
    if (dungeon.tiles[ny][nx] === TILE.WALL) return false;

    // Bump-to-attack
    const target = enemies.find(e => e.hp > 0 && e.x === nx && e.y === ny);
    if (target) {
        playerAttack(player, target, messages);
        if (target.hp <= 0) addXP(player, target.xp, messages);
        return true;
    }

    // Move
    player.x = nx;
    player.y = ny;

    // Auto-pickup items underfoot
    const idx = items.findIndex(it => it.x === nx && it.y === ny);
    if (idx >= 0) {
        pickupItem(items[idx], player, messages);
        items.splice(idx, 1);
    }

    // Stairs hint
    if (dungeon.tiles[ny][nx] === TILE.STAIRS) {
        messages.unshift('[sys] You see stairs going down. Press > to descend.');
    }

    return true;
}

// ── End of turn ───────────────────────────────────────────────────────────────

/** Called after every player action that consumes a turn. */
function endTurn() {
    const { player, dungeon, enemies, messages } = GS;

    // Enemy turns
    for (const enemy of enemies) {
        if (enemy.hp > 0) moveEnemy(enemy, GS);
    }

    // Trim message log
    if (messages.length > MAX_MESSAGES) messages.length = MAX_MESSAGES;

    // Check death
    if (player.hp <= 0) {
        GS.status = 'dead';
        showOverlay(true, {
            title: 'GAME OVER',
            stats: [
                `Reached floor ${GS.floor}`,
                `Level ${player.level}`,
                `${enemies.filter(e => e.hp <= 0).length} enemies slain`,
            ],
        });
    }

    // Recompute FOV then redraw
    computeFOV(dungeon, player.x, player.y);
    redraw();
}

// ── Floor transitions ─────────────────────────────────────────────────────────

function descendStairs() {
    GS = buildState(GS.canvas, GS.ctx, GS.floor + 1, GS.player, GS.messages);
    redraw();
}

// ── New game ──────────────────────────────────────────────────────────────────

function startNewGame() {
    showOverlay(false);
    GS = buildState(GS.canvas, GS.ctx, 1, null);
    redraw();
}
