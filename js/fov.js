// fov.js — Field-of-View via Bresenham line-of-sight
//
// computeFOV() marks each tile as visible/explored each turn.
// Walls adjacent to open space are visible (you can see them blocking the path).

/**
 * Recompute visibility from the given origin tile.
 * Updates dungeon.fov[y][x].visible and .explored in place.
 *
 * @param {{ tiles: number[][], fov: object[][] }} dungeon
 * @param {number} ox  Origin X (player column)
 * @param {number} oy  Origin Y (player row)
 */
function computeFOV(dungeon, ox, oy) {
    const { tiles, fov } = dungeon;

    // Reset visible flags each turn (explored flags persist)
    for (let y = 0; y < MAP_H; y++)
        for (let x = 0; x < MAP_W; x++)
            fov[y][x].visible = false;

    // Origin is always visible
    fov[oy][ox].visible  = true;
    fov[oy][ox].explored = true;

    const r2 = FOV_RADIUS * FOV_RADIUS;

    for (let dy = -FOV_RADIUS; dy <= FOV_RADIUS; dy++) {
        for (let dx = -FOV_RADIUS; dx <= FOV_RADIUS; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (dx * dx + dy * dy > r2) continue;   // circular radius check

            const tx = ox + dx;
            const ty = oy + dy;
            if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue;

            if (hasLOS(tiles, ox, oy, tx, ty)) {
                fov[ty][tx].visible  = true;
                fov[ty][tx].explored = true;
            }
        }
    }
}

/**
 * Bresenham line-of-sight check.
 * Returns true if (x1,y1) is visible from (x0,y0) — meaning no wall
 * blocks the path, OR the first obstacle IS the target tile itself
 * (so wall faces adjacent to open space are revealed).
 *
 * @param {number[][]} tiles
 * @returns {boolean}
 */
function hasLOS(tiles, x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let x = x0, y = y0, err = dx - dy;

    while (x !== x1 || y !== y1) {
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 <  dx) { err += dx; y += sy; }

        if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;

        if (tiles[y][x] === TILE.WALL) {
            // Visible only if this wall IS the destination
            return (x === x1 && y === y1);
        }
    }
    return true;
}
