const { getBestHand } = require('./handEvaluator');

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// 프리플랍: 홀 카드만으로 강도 추정 (0~1)
function preFlopStrength(hand) {
  const a = hand[0].rank, b = hand[1].rank;
  const suited = hand[0].suit === hand[1].suit;
  const isPair = a === b;
  const high = Math.max(a, b), low = Math.min(a, b);
  const gap = high - low;

  if (isPair) {
    if (high >= 13) return 0.95; // KK, AA
    if (high === 12) return 0.90; // QQ
    if (high === 11) return 0.85; // JJ
    if (high >= 9)  return 0.72; // 99, TT
    if (high >= 7)  return 0.60; // 77, 88
    return 0.48;                  // 22-66
  }

  if (suited) {
    if (high === 14 && low === 13) return 0.87; // AKs
    if (high === 14 && low >= 11) return 0.80;  // AQs, AJs
    if (high === 14 && low >= 9)  return 0.68;  // ATs, A9s
    if (high === 14)              return 0.55;  // Axs
    if (high >= 12 && gap <= 1)   return 0.72;  // KQs, QJs
    if (high >= 11 && gap <= 2)   return 0.62;  // KJs, JTs
    if (gap <= 2 && low >= 6)     return 0.52;  // suited connectors
    return 0.36;
  }

  // 오프수트
  if (high === 14 && low === 13) return 0.80; // AKo
  if (high === 14 && low >= 11) return 0.70;  // AQo, AJo
  if (high === 14 && low >= 9)  return 0.58;  // ATo, A9o
  if (high === 14 && low >= 7)  return 0.48;  // A7o-A8o
  if (high >= 12 && low >= 11)  return 0.62;  // KQo, QJo
  if (high >= 12 && gap <= 2)   return 0.52;  // KJo, KTo
  return 0.25;
}

// 포스트플랍: 실제 핸드 랭크 기반 강도 (0~1)
function postFlopStrength(hand, communityCards) {
  const result = getBestHand([...hand, ...communityCards]);
  const rank = result.rank; // 0(하이카드) ~ 9(로열플러시)

  // rank별 기본 강도
  const BASE = [0.15, 0.35, 0.52, 0.65, 0.73, 0.80, 0.88, 0.95, 0.98, 1.00];
  let strength = BASE[rank];

  // 원페어는 페어 랭크에 따라 세분화
  if (rank === 1) {
    const pairRank = result.compKey[0]; // 2~14
    strength = 0.22 + (pairRank / 14) * 0.20; // 0.22~0.42
  }
  // 하이카드도 최고 카드에 따라 세분화
  if (rank === 0) {
    const highRank = result.compKey[0];
    strength = 0.08 + (highRank / 14) * 0.12; // 0.08~0.20
  }

  return clamp(strength, 0, 1);
}

function getHandStrength(hand, communityCards) {
  if (communityCards.length === 0) return preFlopStrength(hand);
  return postFlopStrength(hand, communityCards);
}

// 봇 행동 결정 — 핸드 강도 + 팟 오즈 + 랜덤 노이즈
function decide({ hand, communityCards, callAmount, pot, chips, minRaise }) {
  const strength = getHandStrength(hand, communityCards);
  const noise = (Math.random() - 0.5) * 0.14; // 약간의 블러핑/실수
  const s = clamp(strength + noise, 0, 1);

  const canCheck = callAmount === 0;
  // 콜 후 남은 칩에서 레이즈 가능한 최대 금액
  const maxRaiseComp = chips - callAmount;
  const canRaise = maxRaiseComp >= minRaise && minRaise > 0;

  if (canCheck) {
    if (s > 0.65 && canRaise) {
      const amount = clamp(Math.floor(pot * 0.65), minRaise, maxRaiseComp);
      return { action: 'raise', amount };
    }
    return { action: 'check' };
  }

  // 베팅에 직면한 경우 — 팟 오즈 계산
  const potOdds = callAmount / (pot + callAmount); // 콜에 필요한 최소 이득 비율

  // 강도가 팟 오즈보다 크게 낮으면 폴드
  if (s < 0.28 || s < potOdds - 0.08) {
    return { action: 'fold' };
  }

  if (s > 0.70 && canRaise) {
    const amount = clamp(Math.floor(pot * 0.75), minRaise, maxRaiseComp);
    return { action: 'raise', amount };
  }

  return { action: 'call' };
}

module.exports = { decide };
