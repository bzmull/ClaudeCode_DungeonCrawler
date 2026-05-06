// items.js — Item definitions, ground spawning, pickup, and use logic

// ── Item catalogue ────────────────────────────────────────────────────────────

const ITEM_DEFS = {
    POTION_SMALL:  { type: 'potion',  name: 'Small Potion',    symbol: '!', color: '#f48fb1', heal: 10 },
    POTION_MEDIUM: { type: 'potion',  name: 'Potion',          symbol: '!', color: '#e91e63', heal: 22 },
    POTION_LARGE:  { type: 'potion',  name: 'Large Potion',    symbol: '!', color: '#c2185b', heal: 38 },
    SWORD_1:       { type: 'weapon',  name: 'Short Sword',     symbol: '/', color: '#fff176', bonus: 2 },
    SWORD_2:       { type: 'weapon',  name: 'Long Sword',      symbol: '/', color: '#ffd54f', bonus: 4 },
    SWORD_3:       { type: 'weapon',  name: 'Enchanted Sword', symbol: '/', color: '#ffca28', bonus: 7 },
    ARMOR_1:       { type: 'armor',   name: 'Leather Armor',   symbol: ']', color: '#bcaaa4', bonus: 2 },
    ARMOR_2:       { type: 'armor',   name: 'Chainmail',       symbol: ']', color: '#90a4ae', bonus: 4 },
    ARMOR_3:       { type: 'armor',   name: 'Plate Armor',     symbol: ']', color: '#78909c', bonus: 7 },
    SCROLL:        { type: 'scroll',  name: 'Lightning Scroll',symbol: '?', color: '#ffe57f', minDmg: 15, maxDmg: 25 },
};

// ── Factory ───────────────────────────────────────────────────────────────────

/** Create an item sitting on the ground at (x, y). */
function createGroundItem(key, x, y) {
    return { ...ITEM_DEFS[key], key, x, y };
}

// ── Spawning ──────────────────────────────────────────────────────────────────

/**
 * Scatter items across all rooms except the starting room.
 *
 * @param {Room[]}   rooms
 * @param {number}   floor   1-based floor index (higher = better loot)
 * @param {Function} rng     seeded RNG from dungeon
 * @returns {object[]}       array of ground items
 */
function spawnItems(rooms, floor, rng) {
    const items = [];
    const tier = Math.min(3, floor);   // loot tier caps at 3

    for (let i = 1; i < rooms.length; i++) {
        const room  = rooms[i];
        const count = Math.floor(rng() * 3);   // 0–2 items per room

        for (let j = 0; j < count; j++) {
            const pos = room.randomInner(rng);
            // Skip if another item is already at this spot
            if (items.find(it => it.x === pos.x && it.y === pos.y)) continue;

            const roll = rng();

            if (roll < 0.40) {
                // Potion — skewed toward small on early floors
                const r = rng();
                const key = r < 0.50 ? 'POTION_SMALL'
                          : r < 0.82 ? 'POTION_MEDIUM'
                          :            'POTION_LARGE';
                items.push(createGroundItem(key, pos.x, pos.y));

            } else if (roll < 0.60) {
                // Weapon — tier 1 always available; higher tiers need deeper floors
                const maxTier = tier;
                const t = Math.floor(rng() * maxTier) + 1;
                items.push(createGroundItem(`SWORD_${t}`, pos.x, pos.y));

            } else if (roll < 0.80) {
                // Armor
                const maxTier = tier;
                const t = Math.floor(rng() * maxTier) + 1;
                items.push(createGroundItem(`ARMOR_${t}`, pos.x, pos.y));

            } else if (floor >= 2) {
                // Scrolls only appear from floor 2 onward
                items.push(createGroundItem('SCROLL', pos.x, pos.y));
            }
        }
    }
    return items;
}

// ── Pickup ────────────────────────────────────────────────────────────────────

/**
 * Apply a ground item to the player.
 * Always returns true (item is removed from the ground regardless of outcome).
 *
 * @param {object}   item
 * @param {object}   player
 * @param {string[]} messages  message log (mutated — newest entry prepended)
 * @returns {boolean}  always true
 */
function pickupItem(item, player, messages) {
    switch (item.type) {

        case 'potion':
            player.potions++;
            messages.unshift(`[item] Picked up ${item.name}.`);
            break;

        case 'weapon':
            if (!player.weapon || item.bonus > player.weapon.bonus) {
                const old = player.weapon ? player.weapon.name : 'fists';
                player.weapon = { ...item };
                messages.unshift(`[item] Equipped ${item.name}! (replaced: ${old})`);
            } else {
                messages.unshift(`[item] Found ${item.name} — ${player.weapon.name} is better.`);
            }
            break;

        case 'armor':
            if (!player.armor || item.bonus > player.armor.bonus) {
                const old = player.armor ? player.armor.name : 'none';
                player.armor = { ...item };
                messages.unshift(`[item] Equipped ${item.name}! (replaced: ${old})`);
            } else {
                messages.unshift(`[item] Found ${item.name} — ${player.armor.name} is better.`);
            }
            break;

        case 'scroll':
            player.scrolls++;
            messages.unshift(`[item] Picked up ${item.name}.`);
            break;
    }
    return true;
}

// ── Use ───────────────────────────────────────────────────────────────────────

/**
 * Drink one potion. Heals 20–30 HP.
 * Returns true if a turn was consumed.
 */
function usePotion(player, messages) {
    if (player.potions <= 0) {
        messages.unshift('[sys] You have no potions!');
        return false;
    }
    const heal = 20 + Math.floor(Math.random() * 11);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    player.potions--;
    messages.unshift(`[item] You drink a potion and recover ${heal} HP. (${player.hp}/${player.maxHp})`);
    return true;
}

/**
 * Use a Lightning Scroll — deals 15–25 damage to every visible enemy.
 * Returns true if a turn was consumed.
 */
function useScroll(player, enemies, dungeon, messages) {
    if (player.scrolls <= 0) {
        messages.unshift('[sys] You have no scrolls!');
        return false;
    }
    const dmg = ITEM_DEFS.SCROLL.minDmg +
                Math.floor(Math.random() * (ITEM_DEFS.SCROLL.maxDmg - ITEM_DEFS.SCROLL.minDmg + 1));
    let hits = 0;
    for (const e of enemies) {
        if (e.hp > 0 && dungeon.fov[e.y][e.x].visible) {
            e.hp -= dmg;
            hits++;
        }
    }
    player.scrolls--;
    messages.unshift(
        hits > 0
            ? `[item] Lightning strikes ${hits} enem${hits > 1 ? 'ies' : 'y'} for ${dmg} damage!`
            : '[item] Lightning crackles — but no enemies are in sight!'
    );
    return true;
}
