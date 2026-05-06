// renderer.js — Canvas drawing for dungeon tiles, entities, and items

// ── Colour palette ────────────────────────────────────────────────────────────

const C = {
    bg:           '#07070f',

    // Walls
    wall:         '#2c2018',   // visible wall
    wallDim:      '#17100c',   // explored but not visible

    // Floor
    floor:        '#141226',   // visible floor background
    floorDim:     '#0c0b18',   // explored but not visible
    floorDot:     '#2a2648',   // floor '.' symbol (visible)
    floorDotDim:  '#16152a',   // floor '.' symbol (dim)

    // Stairs
    stairs:       '#ce93d8',
    stairsDim:    '#6a3f72',

    // Player
    player:       '#4fc3f7',
};

// ── Main render call ──────────────────────────────────────────────────────────

/**
 * Redraw the entire canvas from the current game state.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gameState
 */
function render(canvas, ctx, gameState) {
    const { dungeon, player, enemies, items } = gameState;
    const { tiles, fov } = dungeon;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── Tiles ──────────────────────────────────────────────────────────────────
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const f = fov[y][x];
            if (!f.explored) continue;
            drawTile(ctx, x, y, tiles[y][x], !f.visible);
        }
    }

    // ── Ground items (only when visible) ─────────────────────────────────────
    for (const item of items) {
        if (fov[item.y][item.x].visible) {
            drawEntity(ctx, item.x, item.y, item.symbol, item.color);
        }
    }

    // ── Enemies (only when visible and alive) ─────────────────────────────────
    for (const enemy of enemies) {
        if (enemy.hp > 0 && fov[enemy.y][enemy.x].visible) {
            drawEntity(ctx, enemy.x, enemy.y, enemy.symbol, enemy.color);
            drawHealthBar(ctx, enemy);
        }
    }

    // ── Player (always drawn) ─────────────────────────────────────────────────
    drawEntity(ctx, player.x, player.y, '@', C.player);
}

// ── Tile drawing ──────────────────────────────────────────────────────────────

function drawTile(ctx, tx, ty, tile, dim) {
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    if (tile === TILE.WALL) {
        ctx.fillStyle = dim ? C.wallDim : C.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        return;
    }

    // Floor or stairs — fill background first
    ctx.fillStyle = dim ? C.floorDim : C.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    if (tile === TILE.STAIRS) {
        ctx.fillStyle = dim ? C.stairsDim : C.stairs;
        drawChar(ctx, '>', px, py);
    } else {
        ctx.fillStyle = dim ? C.floorDotDim : C.floorDot;
        drawChar(ctx, '.', px, py);
    }
}

// ── Entity drawing ────────────────────────────────────────────────────────────

function drawEntity(ctx, tx, ty, symbol, color) {
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    // Clear the tile to floor background so walls don't bleed through
    ctx.fillStyle = C.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = color;
    drawChar(ctx, symbol, px, py);
}

/** Draw a small HP bar below an enemy tile. */
function drawHealthBar(ctx, enemy) {
    const px  = enemy.x * TILE_SIZE;
    const py  = enemy.y * TILE_SIZE;
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    const bw  = TILE_SIZE - 2;
    const bh  = 2;
    const by  = py + TILE_SIZE - bh;

    ctx.fillStyle = '#3a0000';
    ctx.fillRect(px + 1, by, bw, bh);

    const barColor = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillStyle  = barColor;
    ctx.fillRect(px + 1, by, Math.round(bw * pct), bh);
}

// ── Glyph helper ──────────────────────────────────────────────────────────────

function drawChar(ctx, char, px, py) {
    ctx.font         = `bold ${TILE_SIZE - 3}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
}
