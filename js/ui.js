// ui.js — DOM sidebar: stats panel, inventory panel, and scrolling message log

const MAX_MESSAGES = 60;   // hard cap on stored messages
const LOG_VISIBLE  = 9;    // how many messages to display at once

/**
 * Refresh all sidebar panels from the current game state.
 *
 * @param {object} gameState  { player, floor, messages }
 */
function updateUI(gameState) {
    updateStats(gameState.player, gameState.floor);
    updateInventory(gameState.player);
    updateMessages(gameState.messages);
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function updateStats(player, floor) {
    const panel  = document.getElementById('stats-panel');
    const hpPct  = Math.max(0, player.hp / player.maxHp * 100);
    const xpPct  = Math.min(100, player.xp / player.xpNext * 100);
    const hpColor = hpPct > 50 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336';

    panel.innerHTML = `
        <div class="panel-title">STATUS</div>
        <div class="stat-floor">Floor ${floor}</div>

        <div class="hp-label">HP: ${Math.max(0, player.hp)} / ${player.maxHp}</div>
        <div class="hp-bar-bg">
            <div class="hp-bar-fill" style="width:${hpPct.toFixed(1)}%;background:${hpColor}"></div>
        </div>

        <div class="stat-row"><span class="label">ATK</span><span class="value">${player.atk}</span></div>
        <div class="stat-row"><span class="label">DEF</span><span class="value">${player.def}</span></div>
        <div class="stat-row"><span class="label">Level</span><span class="value">${player.level}</span></div>

        <div class="hp-label" style="margin-top:4px">XP: ${player.xp} / ${player.xpNext}</div>
        <div class="xp-bar-bg">
            <div class="xp-bar-fill" style="width:${xpPct.toFixed(1)}%"></div>
        </div>
    `;
}

// ── Inventory panel ───────────────────────────────────────────────────────────

function updateInventory(player) {
    const panel = document.getElementById('inventory-panel');

    const weaponLabel = player.weapon
        ? `<span class="inv-value">${player.weapon.name} (+${player.weapon.bonus})</span>`
        : `<span class="inv-none">none</span>`;

    const armorLabel = player.armor
        ? `<span class="inv-value">${player.armor.name} (+${player.armor.bonus})</span>`
        : `<span class="inv-none">none</span>`;

    panel.innerHTML = `
        <div class="panel-title">INVENTORY</div>
        <div class="inv-row"><span class="inv-label">Weapon</span>${weaponLabel}</div>
        <div class="inv-row"><span class="inv-label">Armor</span>${armorLabel}</div>
        <div class="inv-row">
            <span class="inv-label">Potions [U]</span>
            <span class="inv-value">${player.potions}</span>
        </div>
        <div class="inv-row">
            <span class="inv-label">Scrolls [Z]</span>
            <span class="inv-value">${player.scrolls}</span>
        </div>
    `;
}

// ── Message log ───────────────────────────────────────────────────────────────

function updateMessages(messages) {
    const log    = document.getElementById('message-log');
    const recent = messages.slice(0, LOG_VISIBLE);

    const rows = recent.map((msg, i) => {
        const opacity = (1 - i * 0.09).toFixed(2);
        const cls     = getMsgClass(msg);
        // Strip the [tag] prefix before displaying
        const text    = msg.replace(/^\[\w+\] /, '');
        return `<div class="msg ${cls}" style="opacity:${opacity}">${text}</div>`;
    }).join('');

    log.innerHTML = `<div class="panel-title">LOG</div>${rows}`;
}

/** Map a message tag prefix to a CSS class. */
function getMsgClass(msg) {
    if (msg.startsWith('[combat]')) return 'msg-combat';
    if (msg.startsWith('[item]'))   return 'msg-item';
    if (msg.startsWith('[level]'))  return 'msg-level';
    if (msg.startsWith('[sys]'))    return 'msg-system';
    return '';
}

// ── Overlay ───────────────────────────────────────────────────────────────────

/**
 * Show or hide the full-screen overlay (game over / new game screen).
 *
 * @param {boolean} visible
 * @param {object}  [opts]  { title, stats, hint }
 */
function showOverlay(visible, opts = {}) {
    const overlay = document.getElementById('overlay');
    if (!visible) {
        overlay.style.display = 'none';
        return;
    }
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="overlay-title">${opts.title || ''}</div>
        ${(opts.stats || []).map(s => `<div class="overlay-stat">${s}</div>`).join('')}
        <div class="overlay-hint">${opts.hint || 'PRESS ENTER TO PLAY AGAIN'}</div>
    `;
}
