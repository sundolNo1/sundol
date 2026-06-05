const { createDeck, shuffle } = require('./deck');
const { getBestHand, compareHands } = require('./handEvaluator');
const BotAI = require('./BotAI');

const DEFAULT_SMALL_BLIND = 1000;
const DEFAULT_BIG_BLIND = 2000;
const STARTING_CHIPS = 1000000;
const ACTION_TIMEOUT_MS = 30000;
const BOT_NAMES = ['Aria', 'Blaze', 'Cipher', 'Drake', 'Echo', 'Frost'];

class GameRoom {
  constructor(roomId, onBroadcast) {
    this.roomId = roomId;
    this.players = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.dealerIndex = -1;
    this.phase = 'waiting';
    this.deck = [];
    this.smallBlind = DEFAULT_SMALL_BLIND;
    this.bigBlind = DEFAULT_BIG_BLIND;
    this.minRaise = DEFAULT_BIG_BLIND;
    this.actingOrder = [];
    this.winners = [];
    this.onBroadcast = onBroadcast || null;
    this.actionTimer = null;
    this.actionDeadline = null;
  }

  addPlayer(id, name) {
    if (this.players.length >= 6) return { error: '방이 꽉 찼습니다 (최대 6명)' };
    if (this.phase !== 'waiting') return { error: '게임이 진행 중입니다' };
    if (this.players.find(p => p.id === id)) return { error: '이미 참가했습니다' };
    this.players.push({ id, name, chips: STARTING_CHIPS, hand: [], totalBet: 0, contributed: 0, folded: false, allIn: false, isBot: false });
    return { success: true };
  }

  addBot() {
    if (this.players.length >= 6) return { error: '방이 꽉 찼습니다 (최대 6명)' };
    if (this.phase !== 'waiting') return { error: '게임이 진행 중입니다' };
    const usedNames = this.players.map(p => p.name);
    const name = BOT_NAMES.find(n => !usedNames.includes(n)) || `Bot${this.players.length}`;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.players.push({ id: botId, name, chips: STARTING_CHIPS, hand: [], totalBet: 0, contributed: 0, folded: false, allIn: false, isBot: true });
    return { success: true };
  }

  removePlayer(id) {
    if (this.phase === 'waiting') {
      this.players = this.players.filter(p => p.id !== id);
    } else {
      const p = this.players.find(pl => pl.id === id);
      if (p) {
        p.folded = true;
        this.actingOrder = this.actingOrder.filter(pid => pid !== id);
        this._checkContinuation();
      }
    }
  }

  startGame(smallBlind, bigBlind) {
    if (this.players.length < 2) return { error: '최소 2명이 필요합니다' };
    if (this.phase !== 'waiting') return { error: '게임이 이미 시작됐습니다' };
    if (smallBlind) this.smallBlind = Number(smallBlind);
    if (bigBlind) this.bigBlind = Number(bigBlind);

    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.winners = [];
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    for (const p of this.players) {
      p.hand = [];
      p.totalBet = 0;
      p.contributed = 0;
      p.folded = false;
      p.allIn = false;
    }

    this.deck = shuffle(createDeck());
    for (let i = 0; i < 2; i++) {
      for (const p of this.players) p.hand.push(this.deck.pop());
    }

    const n = this.players.length;
    const sbIdx = (this.dealerIndex + 1) % n;
    const bbIdx = (this.dealerIndex + 2) % n;
    this._postBlind(sbIdx, this.smallBlind);
    this._postBlind(bbIdx, this.bigBlind);

    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.phase = 'pre-flop';
    this.actingOrder = this._buildActingOrder('pre-flop');
    this._skipIfNoActors();
    this._startActionTimer();
    return { success: true };
  }

  _postBlind(idx, amount) {
    const p = this.players[idx];
    const actual = Math.min(amount, p.chips);
    p.chips -= actual;
    p.totalBet += actual;
    p.contributed += actual;
    this.pot += actual;
    if (p.chips === 0) p.allIn = true;
  }

  _buildActingOrder(phase) {
    const n = this.players.length;
    let startIdx;
    if (phase === 'pre-flop') {
      const bbIdx = (this.dealerIndex + 2) % n;
      startIdx = (bbIdx + 1) % n;
    } else {
      startIdx = (this.dealerIndex + 1) % n;
    }
    const order = [];
    let idx = startIdx;
    for (let i = 0; i < n; i++) {
      const p = this.players[idx];
      if (!p.folded && !p.allIn) order.push(p.id);
      idx = (idx + 1) % n;
    }
    return order;
  }

  _skipIfNoActors() {
    while (this.actingOrder.length === 0 && this.phase !== 'waiting' && this.phase !== 'showdown') {
      this._advancePhase();
    }
  }

  _reorderAfterRaise(raiserId) {
    const n = this.players.length;
    const raiserIdx = this.players.findIndex(p => p.id === raiserId);
    for (let i = 1; i < n; i++) {
      const p = this.players[(raiserIdx + i) % n];
      if (!p.folded && !p.allIn && !this.actingOrder.includes(p.id)) {
        this.actingOrder.push(p.id);
      }
    }
  }

  _startActionTimer() {
    this._clearActionTimer();
    if (!this.actingOrder.length || ['waiting', 'showdown'].includes(this.phase)) {
      this.actionDeadline = null;
      return;
    }

    const actorId = this.actingOrder[0];
    const actor = this.players.find(p => p.id === actorId);

    if (actor?.isBot) {
      this.actionDeadline = null;
      const delay = 800 + Math.random() * 1200;
      this.actionTimer = setTimeout(() => {
        this._executeBotAction(actorId);
        this.onBroadcast?.();
      }, delay);
    } else {
      this.actionDeadline = Date.now() + ACTION_TIMEOUT_MS;
      this.actionTimer = setTimeout(() => {
        const player = this.players.find(p => p.id === actorId);
        if (!player || player.folded || player.allIn) return;
        const canCheck = player.totalBet >= this.currentBet;
        this.playerAction(actorId, canCheck ? 'check' : 'fold', 0);
        this.onBroadcast?.();
      }, ACTION_TIMEOUT_MS);
    }
  }

  _clearActionTimer() {
    if (this.actionTimer) {
      clearTimeout(this.actionTimer);
      this.actionTimer = null;
    }
    this.actionDeadline = null;
  }

  _executeBotAction(botId) {
    const bot = this.players.find(p => p.id === botId);
    if (!bot || bot.folded || bot.allIn) return;
    const callAmount = Math.min(this.currentBet - bot.totalBet, bot.chips);
    const { action, amount } = BotAI.decide({
      hand: bot.hand,
      communityCards: this.communityCards,
      callAmount,
      pot: this.pot,
      chips: bot.chips,
      minRaise: this.minRaise,
    });
    this.playerAction(botId, action, amount || 0);
  }

  playerAction(playerId, action, amount) {
    if (!['pre-flop','flop','turn','river'].includes(this.phase)) return { error: '지금은 베팅 단계가 아닙니다' };
    if (!this.actingOrder.length || this.actingOrder[0] !== playerId) return { error: '당신의 차례가 아닙니다' };

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: '플레이어를 찾을 수 없습니다' };

    this._clearActionTimer();
    this.actingOrder.shift();

    switch (action) {
      case 'fold':
        player.folded = true;
        this.actingOrder = this.actingOrder.filter(id => id !== playerId);
        break;

      case 'check':
        if (player.totalBet < this.currentBet) return { error: '체크할 수 없습니다' };
        break;

      case 'call': {
        const callAmt = Math.min(this.currentBet - player.totalBet, player.chips);
        player.chips -= callAmt;
        player.totalBet += callAmt;
        player.contributed += callAmt;
        this.pot += callAmt;
        if (player.chips === 0) player.allIn = true;
        break;
      }

      case 'raise': {
        const callAmt = this.currentBet - player.totalBet;
        const raiseAmt = Number(amount);
        const totalNeeded = callAmt + raiseAmt;
        const actual = Math.min(totalNeeded, player.chips);
        player.chips -= actual;
        player.totalBet += actual;
        player.contributed += actual;
        this.pot += actual;
        this.minRaise = Math.max(player.totalBet - this.currentBet, this.bigBlind);
        this.currentBet = player.totalBet;
        if (player.chips === 0) player.allIn = true;
        this._reorderAfterRaise(playerId);
        break;
      }

      default:
        return { error: '알 수 없는 액션' };
    }

    this.actingOrder = this.actingOrder.filter(id => {
      const p = this.players.find(pl => pl.id === id);
      return p && !p.folded && !p.allIn;
    });

    this._checkContinuation();
    this._startActionTimer();
    return { success: true };
  }

  _checkContinuation() {
    const nonFolded = this.players.filter(p => !p.folded);
    if (nonFolded.length === 1) {
      this._clearActionTimer();
      const winner = nonFolded[0];
      winner.chips += this.pot;
      this.winners = [{ playerId: winner.id, playerName: winner.name, hand: null, pot: this.pot }];
      this.pot = 0;
      this.phase = 'showdown';
    } else if (this.actingOrder.length === 0 && !['waiting','showdown'].includes(this.phase)) {
      this._advancePhase();
    }
  }

  _advancePhase() {
    for (const p of this.players) p.totalBet = 0;
    this.currentBet = 0;
    this.minRaise = this.bigBlind;

    switch (this.phase) {
      case 'pre-flop':
        this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
        this.phase = 'flop';
        break;
      case 'flop':
        this.communityCards.push(this.deck.pop());
        this.phase = 'turn';
        break;
      case 'turn':
        this.communityCards.push(this.deck.pop());
        this.phase = 'river';
        break;
      case 'river':
        this._showdown();
        return;
    }

    this.actingOrder = this._buildActingOrder(this.phase);
    this._skipIfNoActors();
  }

  // 올인 기여액 기준으로 사이드 팟 분리
  _calculateSidePots() {
    // 올인 플레이어의 기여액이 팟 경계를 결정
    const allInLevels = this.players
      .filter(p => p.allIn && p.contributed > 0)
      .map(p => p.contributed);

    const maxContrib = Math.max(0, ...this.players.map(p => p.contributed));
    const levels = [...new Set([...allInLevels, maxContrib])].sort((a, b) => a - b);

    if (levels.length === 0) {
      return [{ amount: this.pot, eligible: this.players.filter(p => !p.folded) }];
    }

    const pots = [];
    let prevLevel = 0;

    for (const level of levels) {
      let potAmount = 0;
      for (const p of this.players) {
        potAmount += Math.max(0, Math.min(p.contributed, level) - prevLevel);
      }

      // 이 팟을 받을 수 있는 플레이어: 폴드 안 했고 해당 레벨만큼 기여한 플레이어
      const eligible = this.players.filter(p => !p.folded && p.contributed >= level);

      if (potAmount > 0) {
        if (eligible.length > 0) {
          pots.push({ amount: potAmount, eligible });
        } else if (pots.length > 0) {
          // 이 레벨의 수혜 가능자가 없으면 직전 팟에 합산
          pots[pots.length - 1].amount += potAmount;
        }
      }

      prevLevel = level;
    }

    return pots.length > 0 ? pots : [{ amount: this.pot, eligible: this.players.filter(p => !p.folded) }];
  }

  _showdown() {
    this._clearActionTimer();
    this.phase = 'showdown';

    const sidePots = this._calculateSidePots();
    const winnerMap = new Map(); // playerId → 누적 결과

    for (const { amount, eligible } of sidePots) {
      if (eligible.length === 0) continue;

      const results = eligible.map(p => ({
        player: p,
        handResult: getBestHand([...p.hand, ...this.communityCards]),
      })).sort((a, b) => compareHands(b.handResult, a.handResult));

      const best = results[0].handResult;
      const tied = results.filter(r => compareHands(r.handResult, best) === 0);
      const share = Math.floor(amount / tied.length);
      const rem = amount - share * tied.length;

      tied.forEach((w, i) => {
        const winAmt = share + (i === 0 ? rem : 0);
        w.player.chips += winAmt;

        if (winnerMap.has(w.player.id)) {
          winnerMap.get(w.player.id).pot += winAmt;
        } else {
          winnerMap.set(w.player.id, {
            playerId: w.player.id,
            playerName: w.player.name,
            hand: w.handResult,
            pot: winAmt,
          });
        }
      });
    }

    this.winners = [...winnerMap.values()];
    this.pot = 0;
  }

  nextRound() {
    this._clearActionTimer();
    this.players = this.players.filter(p => p.chips > 0);
    this.phase = 'waiting';
  }

  _hostId() {
    return this.players.find(p => !p.isBot)?.id || null;
  }

  getState(forPlayerId) {
    // 플롭 이후 내 핸드 강도 계산
    const myHandStrength = (() => {
      if (!['flop', 'turn', 'river'].includes(this.phase)) return null;
      const me = this.players.find(p => p.id === forPlayerId);
      if (!me || me.folded || me.hand.length < 2) return null;
      return getBestHand([...me.hand, ...this.communityCards]);
    })();

    return {
      roomId: this.roomId,
      phase: this.phase,
      pot: this.pot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      communityCards: this.communityCards,
      currentActorId: this.actingOrder[0] || null,
      dealerIndex: this.dealerIndex,
      winners: this.winners,
      actionDeadline: this.actionDeadline,
      hostId: this._hostId(),
      myHandStrength,
      players: this.players.map((p, i) => ({
        id: p.id,
        name: p.name,
        chips: p.chips,
        totalBet: p.totalBet,
        folded: p.folded,
        allIn: p.allIn,
        isBot: p.isBot,
        isDealer: i === this.dealerIndex,
        isCurrentActor: this.actingOrder[0] === p.id,
        hand: (p.id === forPlayerId || this.phase === 'showdown')
          ? p.hand
          : p.hand.map(() => ({ hidden: true })),
      })),
    };
  }
}

module.exports = GameRoom;
