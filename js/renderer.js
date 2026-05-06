// renderer.js — Canvas drawing: tiles, sprites, items, HP bars

// ── Colour palette ────────────────────────────────────────────────────────────
// Significantly brighter than v1 while keeping the dark retro feel.

const C = {
    bg:            '#06060f',

    // Walls — warm amber-brown stone, clearly visible
    wall:          '#5c3d20',
    wallTop:       '#7a5530',   // top-edge highlight (gives 3-D bevel)
    wallDim:       '#2e1e10',   // explored but outside FOV
    wallTopDim:    '#3d2816',

    // Floor — purple-blue tiles with a visible dot marker
    floor:         '#1c1a30',
    floorDim:      '#0f0e1f',
    floorDot:      '#4c4580',   // tile marker (much brighter than v1)
    floorDotDim:   '#26245a',

    // Stairs
    stairs:        '#e040fb',
    stairsDim:     '#9c27b0',
};

// ── Main render ───────────────────────────────────────────────────────────────

function render(canvas, ctx, gameState) {
    const { dungeon, player, enemies, items } = gameState;
    const { tiles, fov } = dungeon;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tiles
    for (let y = 0; y < MAP_H; y++)
        for (let x = 0; x < MAP_W; x++) {
            const f = fov[y][x];
            if (!f.explored) continue;
            drawTile(ctx, x, y, tiles[y][x], !f.visible);
        }

    // Ground items (visible only)
    for (const item of items)
        if (fov[item.y][item.x].visible)
            drawItem(ctx, item);

    // Enemies (visible and alive)
    for (const enemy of enemies)
        if (enemy.hp > 0 && fov[enemy.y][enemy.x].visible) {
            drawEntitySprite(ctx, enemy.x, enemy.y, enemy.type);
            drawHealthBar(ctx, enemy);
        }

    // Player (always visible)
    drawEntitySprite(ctx, player.x, player.y, 'player');
}

// ── Tile drawing ──────────────────────────────────────────────────────────────

function drawTile(ctx, tx, ty, tile, dim) {
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;

    if (tile === TILE.WALL) {
        ctx.fillStyle = dim ? C.wallDim : C.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Top and left edge highlight — subtle 3-D bevel
        ctx.fillStyle = dim ? C.wallTopDim : C.wallTop;
        ctx.fillRect(px, py, TILE_SIZE, 1);
        ctx.fillRect(px, py, 1, TILE_SIZE);
        return;
    }

    // Floor background
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

/** Draw floor background then the pixel-art sprite for a player or enemy. */
function drawEntitySprite(ctx, tx, ty, type) {
    const px = tx * TILE_SIZE;
    const py = ty * TILE_SIZE;
    ctx.fillStyle = C.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    drawSprite(ctx, type, px, py);
}

/** Ground items keep their ASCII glyph — clear and readable. */
function drawItem(ctx, item) {
    const px = item.x * TILE_SIZE;
    const py = item.y * TILE_SIZE;
    ctx.fillStyle = C.floor;
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = item.color;
    drawChar(ctx, item.symbol, px, py);
}

/** Two-pixel HP bar drawn below an enemy tile. */
function drawHealthBar(ctx, enemy) {
    const px  = enemy.x * TILE_SIZE;
    const py  = enemy.y * TILE_SIZE;
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    const bw  = TILE_SIZE - 2;

    ctx.fillStyle = '#3a0000';
    ctx.fillRect(px + 1, py + TILE_SIZE - 2, bw, 2);

    ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(px + 1, py + TILE_SIZE - 2, Math.round(bw * pct), 2);
}

// ── Glyph helper (used for items and tile symbols) ────────────────────────────

function drawChar(ctx, char, px, py) {
    ctx.font         = `bold ${TILE_SIZE - 3}px monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
}
