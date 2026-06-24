export interface KoreanStock {
  symbol: string;
  name: string;
  exchange: "KOSPI" | "KOSDAQ";
}

export const KOREAN_STOCKS: KoreanStock[] = [
  // KOSPI — 시가총액 상위
  { symbol: "005930.KS", name: "삼성전자",        exchange: "KOSPI" },
  { symbol: "000660.KS", name: "SK하이닉스",      exchange: "KOSPI" },
  { symbol: "373220.KS", name: "LG에너지솔루션",  exchange: "KOSPI" },
  { symbol: "207940.KS", name: "삼성바이오로직스", exchange: "KOSPI" },
  { symbol: "005380.KS", name: "현대자동차",      exchange: "KOSPI" },
  { symbol: "000270.KS", name: "기아",            exchange: "KOSPI" },
  { symbol: "068270.KS", name: "셀트리온",        exchange: "KOSPI" },
  { symbol: "105560.KS", name: "KB금융",          exchange: "KOSPI" },
  { symbol: "055550.KS", name: "신한지주",        exchange: "KOSPI" },
  { symbol: "006400.KS", name: "삼성SDI",         exchange: "KOSPI" },
  { symbol: "051910.KS", name: "LG화학",          exchange: "KOSPI" },
  { symbol: "005490.KS", name: "포스코홀딩스",    exchange: "KOSPI" },
  { symbol: "012330.KS", name: "현대모비스",      exchange: "KOSPI" },
  { symbol: "086790.KS", name: "하나금융지주",    exchange: "KOSPI" },
  { symbol: "035420.KS", name: "네이버",          exchange: "KOSPI" },
  { symbol: "035720.KS", name: "카카오",          exchange: "KOSPI" },
  { symbol: "028260.KS", name: "삼성물산",        exchange: "KOSPI" },
  { symbol: "066570.KS", name: "LG전자",          exchange: "KOSPI" },
  { symbol: "017670.KS", name: "SK텔레콤",        exchange: "KOSPI" },
  { symbol: "096770.KS", name: "SK이노베이션",    exchange: "KOSPI" },
  { symbol: "009150.KS", name: "삼성전기",        exchange: "KOSPI" },
  { symbol: "032830.KS", name: "삼성생명",        exchange: "KOSPI" },
  { symbol: "000810.KS", name: "삼성화재",        exchange: "KOSPI" },
  { symbol: "034020.KS", name: "두산에너빌리티",  exchange: "KOSPI" },
  { symbol: "030200.KS", name: "KT",              exchange: "KOSPI" },
  { symbol: "011170.KS", name: "롯데케미칼",      exchange: "KOSPI" },
  { symbol: "010130.KS", name: "고려아연",        exchange: "KOSPI" },
  { symbol: "015760.KS", name: "한국전력",        exchange: "KOSPI" },
  { symbol: "009830.KS", name: "한화솔루션",      exchange: "KOSPI" },
  { symbol: "003550.KS", name: "LG",              exchange: "KOSPI" },
  { symbol: "034730.KS", name: "SK",              exchange: "KOSPI" },
  { symbol: "000720.KS", name: "현대건설",        exchange: "KOSPI" },
  { symbol: "090430.KS", name: "아모레퍼시픽",    exchange: "KOSPI" },
  { symbol: "097950.KS", name: "CJ제일제당",      exchange: "KOSPI" },
  { symbol: "003670.KS", name: "포스코퓨처엠",    exchange: "KOSPI" },
  { symbol: "012450.KS", name: "한화에어로스페이스", exchange: "KOSPI" },
  { symbol: "316140.KS", name: "우리금융지주",    exchange: "KOSPI" },
  { symbol: "024110.KS", name: "기업은행",        exchange: "KOSPI" },
  { symbol: "032640.KS", name: "LG유플러스",      exchange: "KOSPI" },
  { symbol: "033780.KS", name: "KT&G",            exchange: "KOSPI" },
  { symbol: "352820.KS", name: "하이브",          exchange: "KOSPI" },
  { symbol: "259960.KS", name: "크래프톤",        exchange: "KOSPI" },
  { symbol: "323410.KS", name: "카카오뱅크",      exchange: "KOSPI" },
  { symbol: "377300.KS", name: "카카오페이",      exchange: "KOSPI" },
  { symbol: "004020.KS", name: "현대제철",        exchange: "KOSPI" },
  { symbol: "011780.KS", name: "금호석유",        exchange: "KOSPI" },
  { symbol: "010060.KS", name: "OCI홀딩스",       exchange: "KOSPI" },
  { symbol: "007070.KS", name: "GS리테일",        exchange: "KOSPI" },
  { symbol: "000100.KS", name: "유한양행",        exchange: "KOSPI" },
  { symbol: "018260.KS", name: "삼성에스디에스",  exchange: "KOSPI" },
  { symbol: "005935.KS", name: "삼성전자우",      exchange: "KOSPI" },
  { symbol: "302440.KS", name: "SK바이오사이언스", exchange: "KOSPI" },
  { symbol: "271560.KS", name: "오리온",          exchange: "KOSPI" },
  { symbol: "003490.KS", name: "대한항공",        exchange: "KOSPI" },
  { symbol: "000080.KS", name: "하이트진로",      exchange: "KOSPI" },
  { symbol: "139480.KS", name: "이마트",          exchange: "KOSPI" },
  { symbol: "004990.KS", name: "롯데지주",        exchange: "KOSPI" },
  { symbol: "011210.KS", name: "현대위아",        exchange: "KOSPI" },
  { symbol: "078930.KS", name: "GS",              exchange: "KOSPI" },
  { symbol: "023530.KS", name: "롯데쇼핑",        exchange: "KOSPI" },

  // KOSDAQ — 시가총액 상위
  { symbol: "086520.KQ", name: "에코프로",        exchange: "KOSDAQ" },
  { symbol: "247540.KQ", name: "에코프로비엠",    exchange: "KOSDAQ" },
  { symbol: "058470.KQ", name: "리노공업",        exchange: "KOSDAQ" },
  { symbol: "196170.KQ", name: "알테오젠",        exchange: "KOSDAQ" },
  { symbol: "145020.KQ", name: "휴젤",            exchange: "KOSDAQ" },
  { symbol: "214150.KQ", name: "클래시스",        exchange: "KOSDAQ" },
  { symbol: "214450.KQ", name: "파마리서치",      exchange: "KOSDAQ" },
  { symbol: "403870.KQ", name: "HPSP",            exchange: "KOSDAQ" },
  { symbol: "122870.KQ", name: "와이지엔터테인먼트", exchange: "KOSDAQ" },
  { symbol: "041510.KQ", name: "에스엠",          exchange: "KOSDAQ" },
  { symbol: "035900.KQ", name: "JYP Ent.",        exchange: "KOSDAQ" },
  { symbol: "036930.KQ", name: "주성엔지니어링",  exchange: "KOSDAQ" },
  { symbol: "091990.KQ", name: "셀트리온헬스케어", exchange: "KOSDAQ" },
  { symbol: "141080.KQ", name: "레고켐바이오",    exchange: "KOSDAQ" },
  { symbol: "357780.KQ", name: "솔브레인",        exchange: "KOSDAQ" },
  { symbol: "237880.KQ", name: "클로버추얼패션",  exchange: "KOSDAQ" },
  { symbol: "039030.KQ", name: "이오테크닉스",    exchange: "KOSDAQ" },
  { symbol: "095340.KQ", name: "ISC",             exchange: "KOSDAQ" },
  { symbol: "078340.KQ", name: "컴투스",          exchange: "KOSDAQ" },
  { symbol: "263750.KQ", name: "펄어비스",        exchange: "KOSDAQ" },
  { symbol: "293490.KQ", name: "카카오게임즈",    exchange: "KOSDAQ" },
  { symbol: "096530.KQ", name: "씨젠",            exchange: "KOSDAQ" },
  { symbol: "048260.KQ", name: "오스코텍",        exchange: "KOSDAQ" },
  { symbol: "323180.KQ", name: "케이카",          exchange: "KOSDAQ" },
];

export function searchKoreanStocks(query: string, limit = 6): KoreanStock[] {
  const q = query.trim();
  if (!q) return [];
  const exact: KoreanStock[] = [];
  const partial: KoreanStock[] = [];
  for (const stock of KOREAN_STOCKS) {
    if (stock.name === q) exact.push(stock);
    else if (stock.name.includes(q)) partial.push(stock);
  }
  return [...exact, ...partial].slice(0, limit);
}
