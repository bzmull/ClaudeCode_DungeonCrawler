// combat.js — Turn-based combat resolution

/**
 * Calculate damage dealt by an attacker against a defender.
 * Formula: attack - defense + random roll of [-1, +2]
 * Minimum damage is always 1.
 *
 * @param {number} atk  attacker's effective attack value
 * @param {number} def  defender's effective defense value
 * @returns {number}    damage dealt
 */
function calcDamage(atk, def) {
    const roll = Math.floor(Math.random() * 4) - 1;   // -1 to +2
    return Math.max(1, atk - def + roll);
}

/**
 * Player attacks an enemy.
 * Mutates enemy.hp and prepends a message.
 *
 * @param {object}   player
 * @param {object}   enemy
 * @param {string[]} messages  message log (mutated)
 * @returns {number} damage dealt
 */
function playerAttack(player, enemy, messages) {
    const dmg  = calcDamage(player.atk, enemy.def);
    enemy.hp  -= dmg;

    const suffix = enemy.hp <= 0
        ? ' It dies!'
        : ` (${Math.max(0, enemy.hp)}/${enemy.maxHp} HP)`;

    messages.unshift(`[combat] You hit the ${enemy.name} for ${dmg} damage.${suffix}`);
    return dmg;
}

/**
 * An enemy attacks the player.
 * Mutates player.hp and prepends a message.
 *
 * @param {object}   enemy
 * @param {object}   player
 * @param {string[]} messages
 * @returns {number} damage dealt
 */
function enemyAttack(enemy, player, messages) {
    const dmg   = calcDamage(enemy.atk, player.def);
    player.hp  -= dmg;

    const suffix = player.hp <= 0
        ? ' You die...'
        : ` (${Math.max(0, player.hp)}/${player.maxHp} HP)`;

    messages.unshift(`[combat] ${enemy.name} hits you for ${dmg} damage!${suffix}`);
    return dmg;
}
