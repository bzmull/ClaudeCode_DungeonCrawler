// dungeon.js — Procedural dungeon generation via Binary Space Partitioning (BSP)
//
// Shared constants (loaded first, referenced by all other modules):
//   TILE, MAP_W, MAP_H, TILE_SIZE, FOV_RADIUS

const TILE = Object.freeze({ WALL: 0, FLOOR: 1, STAIRS: 2 });
const MAP_W      = 60;   // tiles wide
const MAP_H      = 40;   // tiles tall
const TILE_SIZE  = 16;   // px per tile
const FOV_RADIUS = 9;    // player sight range in tiles

// ── Room ──────────────────────────────────────────────────────────────────────

class Room {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
    }

    /** Center tile of the room */
    get cx() { return Math.floor(this.x + this.w / 2); }
    get cy() { return Math.floor(this.y + this.h / 2); }

    /** Random non-border tile inside the room */
    randomInner(rng) {
        const ix = this.x + 1 + Math.floor(rng() * Math.max(1, this.w - 2));
        const iy = this.y + 1 + Math.floor(rng() * Math.max(1, this.h - 2));
        return { x: ix, y: iy };
    }
}

// ── Seeded RNG (xorshift32) ───────────────────────────────────────────────────

function makeRNG(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return (s >>> 0) / 0xffffffff;
    };
}

// ── BSP dungeon generator ─────────────────────────────────────────────────────

/**
 * Generate a new dungeon for the given floor number.
 * Higher floors don't change the map size but affect enemy/item seeding.
 *
 * @param {number} floorNum  1-based floor index (used as RNG seed)
 * @returns {{ tiles: number[][], rooms: Room[], fov: object[][], rng: Function }}
 */
function generateDungeon(floorNum) {
    const MIN_ROOM  = 5;
    const MAX_ROOM  = 12;
    const MIN_SPLIT = 9;   // minimum BSP node size before we stop splitting

    const rng = makeRNG(floorNum * 7919 + 31337);

    // Fill map with walls
    const tiles = Array.from({ length: MAP_H }, () => new Array(MAP_W).fill(TILE.WALL));

    // ── BSP tree ───────────────────────────────────────────────────────────────
    // Each node is a plain object: { x, y, w, h, left, right, room }

    const root = mkNode(1, 1, MAP_W - 2, MAP_H - 2);

    function mkNode(x, y, w, h) {
        return { x, y, w, h, left: null, right: null, room: null };
    }

    function split(node) {
        if (node.w < MIN_SPLIT * 2 && node.h < MIN_SPLIT * 2) return;

        // Prefer splitting the longer axis; randomise when square-ish
        const horiz = node.h > node.w * 1.2 ? true
                    : node.w > node.h * 1.2 ? false
                    : rng() < 0.5;

        const axis = horiz ? node.h : node.w;
        if (axis < MIN_SPLIT * 2) return;

        const s = Math.floor(rng() * (axis - MIN_SPLIT * 2 + 1)) + MIN_SPLIT;

        if (horiz) {
            node.left  = mkNode(node.x, node.y,     node.w, s);
            node.right = mkNode(node.x, node.y + s, node.w, node.h - s);
        } else {
            node.left  = mkNode(node.x,     node.y, s,          node.h);
            node.right = mkNode(node.x + s, node.y, node.w - s, node.h);
        }
        split(node.left);
        split(node.right);
    }
    split(root);

    // ── Create rooms in leaf nodes, carve corridors between siblings ───────────

    const rooms = [];

    function buildRooms(node) {
        if (!node.left && !node.right) {
            // Leaf: carve a random-sized room within the node bounds
            const maxW = Math.min(node.w - 2, MAX_ROOM);
            const maxH = Math.min(node.h - 2, MAX_ROOM);
            if (maxW < MIN_ROOM || maxH < MIN_ROOM) return null;

            const rw = Math.floor(rng() * (maxW - MIN_ROOM + 1)) + MIN_ROOM;
            const rh = Math.floor(rng() * (maxH - MIN_ROOM + 1)) + MIN_ROOM;
            const rx = node.x + 1 + Math.floor(rng() * (node.w - rw - 1));
            const ry = node.y + 1 + Math.floor(rng() * (node.h - rh - 1));

            // Guard against rounding pushing tiles outside map
            const safeX = Math.max(1, Math.min(rx, MAP_W - rw - 1));
            const safeY = Math.max(1, Math.min(ry, MAP_H - rh - 1));

            const room = new Room(safeX, safeY, rw, rh);
            node.room = room;
            rooms.push(room);

            for (let y = safeY; y < safeY + rh; y++)
                for (let x = safeX; x < safeX + rw; x++)
                    tiles[y][x] = TILE.FLOOR;

            return room;
        }

        const leftRoom  = buildRooms(node.left);
        const rightRoom = buildRooms(node.right);

        // Connect the two subtrees with an L-shaped corridor
        const a = leftRoom  || rightRoom;
        const b = rightRoom || leftRoom;
        if (a && b && a !== b) {
            carveCorridorL(tiles, a.cx, a.cy, b.cx, b.cy);
        }

        // Return one room so the parent can connect to this subtree
        return rng() < 0.5 ? (leftRoom || rightRoom) : (rightRoom || leftRoom);
    }
    buildRooms(root);

    // Place stairs in the last-generated room (furthest from start by build order)
    if (rooms.length >= 2) {
        const stairRoom = rooms[rooms.length - 1];
        tiles[stairRoom.cy][stairRoom.cx] = TILE.STAIRS;
    }

    // ── FOV state (per-tile visibility + exploration tracking) ─────────────────
    const fov = Array.from({ length: MAP_H }, () =>
        Array.from({ length: MAP_W }, () => ({ visible: false, explored: false }))
    );

    return { tiles, rooms, fov, rng };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Carve an L-shaped floor corridor from (x1,y1) to (x2,y2). */
function carveCorridorL(tiles, x1, y1, x2, y2) {
    let x = x1, y = y1;
    const stamp = (tx, ty) => {
        if (tx > 0 && tx < MAP_W - 1 && ty > 0 && ty < MAP_H - 1)
            tiles[ty][tx] = TILE.FLOOR;
    };
    while (x !== x2) { stamp(x, y); x += x < x2 ? 1 : -1; }
    while (y !== y2) { stamp(x, y); y += y < y2 ? 1 : -1; }
    stamp(x, y);
}
