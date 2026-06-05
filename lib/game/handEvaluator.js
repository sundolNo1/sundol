const HAND_NAMES = ['하이카드','원페어','투페어','트리플','스트레이트','플러시','풀하우스','포카드','스트레이트 플러시','로열 플러시'];

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function getSortedByCount(rankCounts) {
  return Object.entries(rankCounts)
    .sort(([ra, ca], [rb, cb]) => cb - ca || Number(rb) - Number(ra))
    .flatMap(([rank, count]) => Array(count).fill(Number(rank)));
}

function evaluateHand(cards) {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);

  const rankCounts = {};
  for (const r of ranks) rankCounts[r] = (rankCounts[r] || 0) + 1;
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  let isStraight = false;
  let straightHigh = ranks[0];
  if (new Set(ranks).size === 5) {
    if (ranks[0] - ranks[4] === 4) {
      isStraight = true;
    } else if (ranks[0] === 14 && ranks[1] === 5 && ranks[4] === 2) {
      isStraight = true;
      straightHigh = 5; // wheel
    }
  }

  let handRank, compKey;

  if (isFlush && isStraight && straightHigh === 14) {
    handRank = 9; compKey = [14];
  } else if (isFlush && isStraight) {
    handRank = 8; compKey = [straightHigh];
  } else if (counts[0] === 4) {
    handRank = 7; compKey = getSortedByCount(rankCounts);
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = 6; compKey = getSortedByCount(rankCounts);
  } else if (isFlush) {
    handRank = 5; compKey = ranks;
  } else if (isStraight) {
    handRank = 4; compKey = [straightHigh];
  } else if (counts[0] === 3) {
    handRank = 3; compKey = getSortedByCount(rankCounts);
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = 2; compKey = getSortedByCount(rankCounts);
  } else if (counts[0] === 2) {
    handRank = 1; compKey = getSortedByCount(rankCounts);
  } else {
    handRank = 0; compKey = ranks;
  }

  return { rank: handRank, compKey, name: HAND_NAMES[handRank] };
}

function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < a.compKey.length; i++) {
    if (a.compKey[i] !== b.compKey[i]) return a.compKey[i] - b.compKey[i];
  }
  return 0;
}

function getBestHand(cards) {
  return combinations(cards, 5)
    .map(combo => evaluateHand(combo))
    .reduce((best, h) => compareHands(h, best) > 0 ? h : best);
}

module.exports = { getBestHand, compareHands };
