// player.js — Player creation, stat accessors, and XP / level-up logic

/**
 * Create a fresh player at the given tile position.
 * Getters on `atk` and `def` automatically include equipped gear bonuses.
 *
 * @param {number} x
 * @param {number} y
 * @returns {object} player
 */
function createPlayer(x, y) {
    return {
        x, y,

        // Vitals
        hp: 30, maxHp: 30,

        // Base combat stats (gear adds on top via getters)
        baseAtk: 5,
        baseDef: 2,

        // Progression
        xp: 0, xpNext: 20, level: 1,

        // Inventory
        weapon:  null,   // equipped weapon item or null
        armor:   null,   // equipped armor item or null
        potions: 1,      // stackable consumables
        scrolls: 0,

        /** Effective attack including weapon bonus */
        get atk() { return this.baseAtk + (this.weapon ? this.weapon.bonus : 0); },

        /** Effective defense including armor bonus */
        get def() { return this.baseDef + (this.armor  ? this.armor.bonus  : 0); },
    };
}

/**
 * Award XP to the player; trigger level-up(s) if threshold is reached.
 *
 * @param {object}   player
 * @param {number}   amount
 * @param {string[]} messages  message log (mutated)
 */
function addXP(player, amount, messages) {
    player.xp += amount;
    while (player.xp >= player.xpNext) {
        player.xp      -= player.xpNext;
        player.level   += 1;
        player.maxHp   += 8;
        player.hp       = Math.min(player.hp + 8, player.maxHp);  // partial heal on level-up
        player.baseAtk += 1;
        player.xpNext   = Math.floor(player.xpNext * 1.6);
        messages.unshift(`[level] *** LEVEL UP! You are now level ${player.level}! ***`);
    }
}
