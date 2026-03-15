// ══════════════════════════════════════════════
// game.js — Logic game ghép chữ Hán
// ══════════════════════════════════════════════

const CARD_PATH  = '../frontend/assets/cards/';
const TIMER_SECS = 30;

const Game = {
  levelData:        null,
  wordMap:          {},
  currentLevel:     1,
  tableChar:        null,
  selectedIdx:      null,
  timer:            null,
  timerValue:       TIMER_SECS,
  score:            0,
  wordsPlayed:      [],
  players:          [],
  currentPlayerIdx: 0,
  humanIdx:         0,

  // ── Khởi tạo ────────────────────────────

  async init(levelData, players) {
    this.levelData        = levelData;
    this.players          = players;
    this.humanIdx         = players.findIndex(p => !p.isAI);
    this.score            = 0;
    this.wordsPlayed      = [];
    this.tableChar        = null;
    this.selectedIdx      = null;
    this.currentPlayerIdx = 0;

    this.wordMap = {};
    levelData.words.forEach(w => {
      this.wordMap[w.word] = w.meaning;
      const rev = w.word.split('').reverse().join('');
      if (!this.wordMap[rev]) this.wordMap[rev] = w.meaning + ' (đảo)';
    });

    const deck = this.buildDeck(levelData.chars);
    const handSize = Math.floor(deck.length / players.length);
    players.forEach(p => {
      p.hand        = deck.splice(0, handSize);
      p.wordsPlayed = 0;
    });

    this.renderAll();
    this.startTurn();
  },

  buildDeck(chars) {
  let deck = [...chars]; // mỗi chữ 1 lần, tổng = 52
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
},

  // ── Ảnh bài ─────────────────────────────

  getCardImgSrc(char) {
    return `${CARD_PATH}${encodeURIComponent(char)}.png`;
  },

  createCardEl(char, idx, options = {}) {
    const { selected = false, playable = false, disabled = false, mini = false } = options;
    const div = document.createElement('div');

    if (mini) {
      div.className = 'card-mini';
      div.innerHTML = `
        <img src="${this.getCardImgSrc(char)}" alt="${char}"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="card-fallback" style="display:none">${char}</span>`;
      return div;
    }

    div.className = ['card',
      selected ? 'card--selected' : '',
      playable ? 'card--playable' : '',
      disabled ? 'card--disabled' : '',
    ].filter(Boolean).join(' ');

    div.dataset.idx  = idx;
    div.dataset.char = char;
    div.innerHTML = `
      <img src="${this.getCardImgSrc(char)}" alt="${char}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="card-fallback" style="display:none">${char}</span>
      <span class="card-pinyin">${PINYIN[char] || ''}</span>`;

    if (!disabled) div.addEventListener('click', () => this.selectCard(idx));
    return div;
  },

  // ── Turn system ──────────────────────────

  startTurn() {
    console.log(`▶ startTurn: [${this.currentPlayerIdx}] ${this.players[this.currentPlayerIdx]?.name} | tableChar=${this.tableChar}`);
    this.clearTimer();
    this.selectedIdx = null;
    UI.setPlayBtnEnabled(false);
    UI.setSkipBtnEnabled(false);

    const player = this.players[this.currentPlayerIdx];
    UI.setCurrentPlayer(player);
    this.renderAll();

    if (player.isAI) {
      setTimeout(() => this.aiTakeTurn(), 1200 + Math.random() * 600);
    } else {
      UI.setSkipBtnEnabled(true);
      this.startTimer();
    }
  },

  startTimer() {
    this.timerValue = TIMER_SECS;
    UI.updateTimer(this.timerValue);
    this.timer = setInterval(() => {
      this.timerValue--;
      UI.updateTimer(this.timerValue);
      if (this.timerValue <= 0) {
        this.clearTimer();
        UI.showToast('⏰ Hết giờ! Bỏ qua lượt.');
        this.addLog(`${this.players[this.currentPlayerIdx].name} hết giờ`);
        this.doSkipLogic();
        this.advanceTurn();
      }
    }, 1000);
  },

  clearTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  advanceTurn() {
    console.log(`▶ advanceTurn: ${this.currentPlayerIdx} → ${(this.currentPlayerIdx + 1) % this.players.length}`);
    this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
    setTimeout(() => this.startTurn(), 400);
  },

  // ── Human: chọn lá ───────────────────────

  selectCard(idx) {
    if (this.currentPlayerIdx !== this.humanIdx) return;
    this.selectedIdx = (this.selectedIdx === idx) ? null : idx;
    this.renderHand();
    UI.setPlayBtnEnabled(this.selectedIdx !== null);
  },

  // ── Human: đánh bài ──────────────────────

  playCard() {
    if (this.selectedIdx === null) return;
    if (this.currentPlayerIdx !== this.humanIdx) return;

    const player = this.players[this.humanIdx];
    const char   = player.hand[this.selectedIdx];

    // Validate trước — nếu sai thì return, KHÔNG xoá lá, KHÔNG chuyển lượt
    if (this.tableChar) {
      const result = this.getWordResult(this.tableChar, char);
      if (!result) {
        UI.showToast(`❌ "${this.tableChar} + ${char}" không ghép được từ có nghĩa!`, true);
        return;
      }
    }

    // Hợp lệ → dừng timer, đánh bài
    this.clearTimer();
    UI.setPlayBtnEnabled(false);
    UI.setSkipBtnEnabled(false);
    const idx = this.selectedIdx;
    this.selectedIdx = null;
    this.executePlay(this.humanIdx, idx);
  },

  // ── Human: bỏ qua ────────────────────────

  skipTurn() {
    if (this.currentPlayerIdx !== this.humanIdx) return;
    this.clearTimer();
    UI.setPlayBtnEnabled(false);
    UI.setSkipBtnEnabled(false);
    this.selectedIdx = null;

    this.addLog(`${this.players[this.currentPlayerIdx].name} bỏ qua lượt`);
    UI.showToast(`${this.players[this.currentPlayerIdx].name} bỏ qua lượt`);
    this.doSkipLogic();
    this.advanceTurn();
  },

  // ── AI: tự động đánh ─────────────────────

  aiTakeTurn() {
    if (this.currentPlayerIdx === this.humanIdx) return;
    const player = this.players[this.currentPlayerIdx];

    // Bàn trống → đánh lá có nhiều kết nối nhất
    if (!this.tableChar) {
      let bestIdx = 0, bestScore = -1;
      player.hand.forEach((char, idx) => {
        const s = this.countConnections(char, player.hand);
        if (s > bestScore) { bestScore = s; bestIdx = idx; }
      });
      this.executePlay(this.currentPlayerIdx, bestIdx);
      return;
    }

    // Tìm lá ghép được
    const playable = player.hand
      .map((char, idx) => ({ idx, char, result: this.getWordResult(this.tableChar, char) }))
      .filter(x => x.result);

    if (!playable.length) {
      this.addLog(`${player.name} không có lá hợp lệ, bỏ qua`);
      UI.showToast(`${player.name} bỏ qua lượt`);
      this.doSkipLogic();
      this.advanceTurn();
      return;
    }

    playable.sort((a, b) =>
      this.countConnections(b.char, player.hand) - this.countConnections(a.char, player.hand)
    );
    this.executePlay(this.currentPlayerIdx, playable[0].idx);
  },

  // ── Core: thực hiện đánh bài ─────────────
  // Hàm này CHỈ xử lý logic, không validate nữa

  executePlay(playerIdx, cardIdx) {
    console.log(`▶ executePlay: [${playerIdx}] ${this.players[playerIdx]?.name} | card=${this.players[playerIdx]?.hand[cardIdx]}`);
    const player = this.players[playerIdx];
    const char   = player.hand[cardIdx];

    // Lá đầu tiên: đánh bất kỳ
    if (!this.tableChar) {
      player.hand.splice(cardIdx, 1);
      this.tableChar = char;
      this.addLog(`${player.name} đánh lá đầu: ${char}`);
      UI.renderTableCard(char, this.getCardImgSrc(char));
      UI.clearWordDisplay();
      this.renderAll();
      if (!this.checkWin(playerIdx)) this.advanceTurn();
      return;
    }

    // Ghép từ
    const result = this.getWordResult(this.tableChar, char);
    if (!result) return; // safety, không nên xảy ra

    player.hand.splice(cardIdx, 1);
    player.wordsPlayed = (player.wordsPlayed || 0) + 1;
    this.tableChar = char;
    this.score += 10;
    this.wordsPlayed.push(result);

    this.addLog(`✨ ${player.name}: ${result.word} = ${result.meaning}`);
    UI.showToast(`✨ ${result.word} · ${result.meaning}`);
    UI.renderTableCard(char, this.getCardImgSrc(char));
    UI.showWordFormed(result.word, result.meaning);
    this.renderAll();

    if (!this.checkWin(playerIdx)) this.advanceTurn();
  },

  // ── Skip: reset bàn nếu cần ──────────────

  doSkipLogic() {
    if (!this.tableChar) return;
    const anyoneCanPlay = this.players.some((p, i) => {
      if (i === this.currentPlayerIdx) return false;
      return p.hand.some(c => this.getWordResult(this.tableChar, c));
    });
    if (!anyoneCanPlay) {
      this.tableChar = null;
      UI.renderTableCard(null, null);
      UI.clearWordDisplay();
      this.addLog('🔄 Không ai ghép được — reset bàn');
      UI.showToast('🔄 Reset bàn, đánh lá mới!');
    }
  },

  // ── Matching ─────────────────────────────

  getWordResult(a, b) {
    if (!a || !b) return null;
    const w1 = a + b, w2 = b + a;
    if (this.wordMap[w1]) return { word: w1, meaning: this.wordMap[w1] };
    if (this.wordMap[w2]) return { word: w2, meaning: this.wordMap[w2] };
    return null;
  },

  countConnections(char, hand) {
    return hand.filter(c => c !== char && this.getWordResult(char, c)).length;
  },

  // ── Win ──────────────────────────────────

  checkWin(playerIdx) {
    if (this.players[playerIdx].hand.length === 0) {
      this.clearTimer();
      setTimeout(() => this.onWin(playerIdx), 500);
      return true;
    }
    return false;
  },

  async onWin(winnerIdx) {
    const winner = this.players[winnerIdx];
    UI.showWinScreen(winner, this.players, this.wordsPlayed, this.score);
    if (!winner.isAI) {
      try {
        const result = await Api.completeLevel(this.currentLevel, this.score);
        if (result.level_up) UI.showToast(`🎉 Mở khóa Level ${result.new_level}!`);
      } catch (e) {
        console.error('Lưu tiến độ thất bại:', e);
      }
    }
  },

  // ── Render ───────────────────────────────

  renderAll() {
    this.renderPlayerPanels();
    this.renderHand();
  },

  renderPlayerPanels() {
    UI.renderPlayerPanels(
      this.players,
      this.currentPlayerIdx,
      (char, idx) => this.createCardEl(char, idx, { mini: true })
    );
  },

  renderHand() {
    const isHumanTurn = this.currentPlayerIdx === this.humanIdx;
    const human       = this.players[this.humanIdx];

    const cards = human.hand.map((char, idx) => {
      const playable = this.tableChar
        ? !!this.getWordResult(this.tableChar, char)
        : true;
      return this.createCardEl(char, idx, {
        selected: this.selectedIdx === idx && isHumanTurn,
        playable:  playable && isHumanTurn,
        disabled: !isHumanTurn,
      });
    });

    UI.renderHand(cards, human, isHumanTurn);
    UI.setPlayBtnEnabled(isHumanTurn && this.selectedIdx !== null);
    UI.setSkipBtnEnabled(isHumanTurn);
  },

  addLog(msg) { UI.addLog(msg); },
};

// ── Pinyin ───────────────────────────────────
const PINYIN = {
  "你":"nǐ","好":"hǎo","人":"rén","大":"dà","学":"xué","生":"shēng","中":"zhōng",
  "文":"wén","日":"rì","月":"yuè","水":"shuǐ","火":"huǒ","山":"shān","天":"tiān",
  "地":"dì","心":"xīn","手":"shǒu","口":"kǒu","目":"mù","耳":"ěr","父":"fù",
  "母":"mǔ","子":"zǐ","女":"nǚ","兄":"xiōng","弟":"dì","姐":"jiě","妹":"mèi",
  "家":"jiā","门":"mén","年":"nián","时":"shí","分":"fēn","上":"shàng","下":"xià",
  "左":"zuǒ","右":"yòu","前":"qián","后":"hòu","里":"lǐ","外":"wài","多":"duō",
  "少":"shǎo","长":"cháng","短":"duǎn","高":"gāo","低":"dī","新":"xīn","旧":"jiù",
  "爱":"ài","恨":"hèn","喜":"xǐ","怒":"nù","哀":"āi","乐":"lè","思":"sī",
  "想":"xiǎng","知":"zhī","道":"dào","理":"lǐ","情":"qíng","意":"yì","志":"zhì",
  "信":"xìn","望":"wàng","希":"xī","梦":"mèng","觉":"jué","感":"gǎn","动":"dòng",
  "静":"jìng","明":"míng","暗":"àn","真":"zhēn","假":"jiǎ","善":"shàn","恶":"è",
  "美":"měi","丑":"chǒu","光":"guāng","习":"xí","象":"xiàng","悟":"wù",
  "爸":"bà","白":"bái","百":"bǎi","班":"bān","半":"bàn","帮":"bāng","忙":"máng",
  "包":"bāo","杯":"bēi","北":"běi","边":"biān","京":"jīng","本":"běn","比":"bǐ",
  "别":"bié","病":"bìng","不":"bù","菜":"cài","茶":"chá","差":"chà","常":"cháng",
  "尝":"cháng","唱":"chàng","歌":"gē","车":"chē","票":"piào","站":"zhàn","吃":"chī",
  "饭":"fàn","出":"chū","来":"lái","去":"qù","穿":"chuān","床":"chuáng","起":"qǐ",
  "对":"duì","客":"kè","气":"qì","用":"yòng","非":"fēi","八":"bā","的":"de",
};