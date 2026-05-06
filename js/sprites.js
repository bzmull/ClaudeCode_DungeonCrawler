// sprites.js — Pixel art sprite definitions and canvas renderer
//
// Each sprite is an 8×8 grid of color-key characters.
// SPRITE_SCALE=2 maps each design pixel to a 2×2 canvas pixel block,
// producing a 16×16 sprite that fills exactly one TILE_SIZE tile.
// '.' = transparent (the floor background shows through).

const SPRITE_SCALE = 2;

// ── Color palettes ────────────────────────────────────────────────────────────

const SP = {

    player: {             // Silver knight with blue armor
        H: '#cfd8dc',     // silver helmet
        f: '#ffccbc',     // skin (visor gap)
        G: '#ffd54f',     // gold visor bar
        S: '#607d8b',     // dark steel shoulder / legs
        B: '#1e88e5',     // blue body armor
        L: '#455a64',     // dark leg armor
    },

    goblin: {             // Small green goblin, googly eyes
        d: '#2e7d32',     // dark green shadow
        h: '#66bb6a',     // light green head
        e: '#e8f5e9',     // eye white
        b: '#4caf50',     // body green
    },

    orc: {                // Red orc with ivory tusks
        d: '#7f0000',     // very dark red
        h: '#ef5350',     // red head
        E: '#ffee58',     // yellow eyes
        b: '#c62828',     // dark red body
        t: '#fff9c4',     // ivory tusks
    },

    skeleton: {           // Bone-white skull and ribs
        h: '#f5f5f5',     // bone white
        e: '#1a1a2e',     // dark eye socket
        g: '#9e9e9e',     // gray jaw / teeth gap
        b: '#e0e0e0',     // pale bone body
    },

    troll: {              // Hulking brown troll
        d: '#3e2723',     // very dark brown
        h: '#a1887f',     // light brown head
        E: '#ff7043',     // orange-red eyes
        r: '#ef9a9a',     // pink nose
        B: '#6d4c41',     // brown body
    },
};

// ── Sprite data (8 rows × 8 cols) ─────────────────────────────────────────────

const SPRITE_DATA = {

    // Silver helmet + gold visor bar + blue tunic + dark steel legs
    player: [
        '.HHHH...',
        '.HfGH...',
        '.HHHH...',
        'SSBBBBSS',
        '.SBBBBS.',
        '.SBBBBS.',
        '..SLLS..',
        '..L..L..',
    ],

    // Pointy head, two white googly eyes, green body
    goblin: [
        '...dd...',
        '.dheehd.',
        '.dhhhhd.',
        '..hbbh..',
        '..hbbh..',
        '...hh...',
        '..h..h..',
        '........',
    ],

    // Wide angry face, yellow eyes, ivory tusks
    orc: [
        '..dddd..',
        '.dhhhd..',
        'dhhEEhhd',
        'dhhhhhhd',
        '.dt..td.',
        '..bbbb..',
        '..b..b..',
        '........',
    ],

    // Skull with empty eye sockets, ribcage
    skeleton: [
        '..hhh...',
        '.he.eh..',
        '.h...h..',
        '.hgggh..',
        '..bbb...',
        '.b...b..',
        '.b...b..',
        '........',
    ],

    // Massive brown hulk, orange eyes, pink nose
    troll: [
        '.ddddd..',
        'ddhhhdd.',
        'dhErEhhd',
        'dhhhhhhd',
        'dBBBBBBd',
        'dBBBBBBd',
        '.dBBBBd.',
        '........',
    ],
};

// ── Draw function ─────────────────────────────────────────────────────────────

/**
 * Draw a pixel art sprite at canvas pixel position (px, py).
 * Transparent ('.') pixels are skipped — the caller should draw the floor
 * background first so it shows through.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} type  key in SPRITE_DATA / SP  (e.g. 'player', 'goblin')
 * @param {number} px    canvas x pixel (top-left of tile)
 * @param {number} py    canvas y pixel (top-left of tile)
 */
function drawSprite(ctx, type, px, py) {
    const palette = SP[type];
    const rows    = SPRITE_DATA[type];
    if (!rows || !palette) return;

    for (let row = 0; row < rows.length; row++) {
        const line = rows[row];
        for (let col = 0; col < line.length; col++) {
            const key = line[col];
            if (key === '.') continue;
            const color = palette[key];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(
                px + col * SPRITE_SCALE,
                py + row * SPRITE_SCALE,
                SPRITE_SCALE,
                SPRITE_SCALE
            );
        }
    }
}
