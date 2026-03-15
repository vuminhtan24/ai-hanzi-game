// ══════════════════════════════════════════════
// ui.js — Tất cả thao tác DOM
// ══════════════════════════════════════════════

const UI = {

  // ── Toast ────────────────────────────────

  _toastTimer: null,
  showToast(msg, isError = false) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' toast--error' : '') + ' toast--show';
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.className = 'toast' + (isError ? ' toast--error' : '');
    }, 2800);
  },

  // ── Timer ────────────────────────────────

  updateTimer(val) {
    const el = document.getElementById('timer-value');
    if (!el) return;
    el.textContent = val;
    el.parentElement.dataset.state =
      val > 15 ? 'ok' : val > 8 ? 'warn' : 'danger';
  },

  // ── Current player badge ─────────────────

  setCurrentPlayer(player) {
    const el = document.getElementById('current-player-name');
    if (el) el.textContent = player.name + (player.isAI ? ' 🤖' : '');
  },

  // ── Table card ───────────────────────────

  renderTableCard(char, imgSrc) {
  const el = document.getElementById('table-card');
  if (!el) return;
  if (!char) {
    el.innerHTML = `<div class="empty-slot">牌</div>`;
    return;
  }
  el.innerHTML = `
    <div class="table-card">
      <img src="${imgSrc}" alt="${char}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="card-fallback" style="display:none">${char}</span>
    </div>`;
},

  // ── Word formed display ──────────────────

  showWordFormed(word, meaning) {
    const wEl = document.getElementById('word-hanzi');
    const mEl = document.getElementById('word-meaning');
    if (wEl) wEl.textContent = word;
    if (mEl) mEl.textContent = meaning;
  },

  clearWordDisplay() {
    const wEl = document.getElementById('word-hanzi');
    const mEl = document.getElementById('word-meaning');
    if (wEl) wEl.textContent = '—';
    if (mEl) mEl.textContent = 'Đánh lá đầu tiên để bắt đầu';
  },

  // ── Player panels ────────────────────────

  renderPlayerPanels(players, currentIdx, createMiniCard) {
    const left  = document.getElementById('left-panel');
    const right = document.getElementById('right-panel');
    if (!left || !right) return;
    left.innerHTML  = '';
    right.innerHTML = '';

    players.forEach((p, i) => {
      const isActive = i === currentIdx;
      const card = document.createElement('div');
      card.className = 'player-panel-card' + (isActive ? ' player-panel-card--active' : '');
      card.innerHTML = `
        <div class="player-panel-header">
          <span class="player-avatar" style="color:${p.color}">${p.avatar}</span>
          <span class="player-name">${p.name}${p.isAI ? ' 🤖' : ''}</span>
          ${isActive ? '<span class="active-dot"></span>' : ''}
        </div>
        <div class="player-stats">
          <span>${p.hand.length} lá còn</span>
          <span>${p.wordsPlayed || 0} từ</span>
        </div>`;

      if (i % 2 === 0) left.appendChild(card);
      else right.appendChild(card);
    });
  },

  // ── Hand ─────────────────────────────────

  renderHand(cardEls, player, isHumanTurn) {
    const container = document.getElementById('hand-cards');
    const label     = document.getElementById('hand-label');
    if (!container) return;

    if (label) {
      label.textContent = isHumanTurn
        ? `🀄 Bài của bạn (${player.hand.length} lá) — Chọn 1 lá để đánh`
        : `Đang chờ ${player.name}...`;
    }

    container.innerHTML = '';
    cardEls.forEach(el => container.appendChild(el));
  },

  // ── Buttons ──────────────────────────────

  setPlayBtnEnabled(enabled) {
    const btn = document.getElementById('btn-play');
    if (btn) btn.disabled = !enabled;
  },

  setSkipBtnEnabled(enabled) {
    const btn = document.getElementById('btn-skip');
    if (btn) btn.disabled = !enabled;
  },

  // ── Log ──────────────────────────────────

  addLog(msg) {
    const log = document.getElementById('game-log');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'log-entry' + (msg.includes('✨') ? ' log-entry--highlight' : '');
    div.textContent = msg;
    log.insertBefore(div, log.firstChild);
    while (log.children.length > 20) log.removeChild(log.lastChild);
  },

  // ── Win screen ───────────────────────────

  showWinScreen(winner, players, wordsPlayed, score) {
    document.getElementById('win-name').textContent =
      `${winner.avatar} ${winner.name} chiến thắng!`;

    const statsEl = document.getElementById('win-stats');
    statsEl.innerHTML = '';
    players.forEach(p => {
      statsEl.innerHTML += `
        <div class="stat-row">
          <span>${p.avatar} ${p.name}</span>
          <span class="stat-val">${p.hand.length} lá còn · ${p.wordsPlayed || 0} từ</span>
        </div>`;
    });
    statsEl.innerHTML += `
      <div class="stat-row">
        <span>Điểm ván này</span>
        <span class="stat-val">${score}</span>
      </div>
      <div class="stat-row">
        <span>Từ ghép hay nhất</span>
        <span class="stat-val">${wordsPlayed.length ? wordsPlayed[wordsPlayed.length-1].word : '—'}</span>
      </div>`;

    showScreen('win-screen');
    spawnConfetti();
  },
};

// ── Screen switcher ──────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen--active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('screen--active');
}

// ── Confetti ─────────────────────────────────

function spawnConfetti() {
  const colors = ['#c9a84c','#e74c3c','#3498db','#2ecc71','#e8c96a','#9b59b6'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.cssText = `
        left:${Math.random()*100}vw; top:-12px;
        background:${colors[i % colors.length]};
        width:${6+Math.random()*8}px; height:${6+Math.random()*8}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration:${2.5+Math.random()*2}s;
        animation-delay:${Math.random()*0.8}s;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 30);
  }
}
