// ═══════════════════════════════════════════════════════════
// marketData.ts — Vrai moteur de données de marché
// Appels directs navigateur (clés perso côté client) :
//   CoinGecko (sans clé), Alternative.me (sans clé),
//   FMP / Finnhub / LunarCrush (clés perso fournies par l'utilisateur)
// Porté depuis isia.html, en TypeScript.
// ═══════════════════════════════════════════════════════════

import { StockTicker, CryptoTicker, MetalPrice, NewsItem } from '../types.ts';

// ─── Types internes ───
export type Regime = 'bull' | 'bear' | 'range' | 'highVol' | 'lowVol';

export interface GlobalMarket {
  totalMcapEur: number | null;
  btcDominance: number | null;
  change24h: number | null;
}

export interface FearGreed {
  value: number;
  classification: string;
}

// ─── Helpers ───
async function getJson(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url.split('?')[0]}`);
  return res.json();
}

export function classifyRegime(change24h: number, change7d: number): Regime {
  if (Math.abs(change24h) >= 6) return 'highVol';
  if (Math.abs(change24h) <= 1 && Math.abs(change7d) <= 3) return 'lowVol';
  if (change7d >= 8) return 'bull';
  if (change7d <= -8) return 'bear';
  return 'range';
}

// Intervalle de confiance de Wilson à 95% sur un taux de réussite
export function wilsonInterval(wins: number, n: number): { low: number; high: number } | null {
  if (!n) return null;
  const z = 1.96, p = wins / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const marge = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return { low: Math.max(0, (centre - marge) * 100), high: Math.min(100, (centre + marge) * 100) };
}

// ═══════════════════════════════════════════════════════════
// CRYPTO — CoinGecko (gratuit, sans clé)
// ═══════════════════════════════════════════════════════════
export async function fetchCryptos(): Promise<CryptoTicker[]> {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=50&page=1&price_change_percentage=24h,7d&sparkline=true';
  const data = await getJson(url);
  if (!Array.isArray(data)) throw new Error('Réponse CoinGecko inattendue.');
  return data.map((c: any): CryptoTicker => ({
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    price: c.current_price,
    change24h: c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0,
    change7d: c.price_change_percentage_7d_in_currency ?? 0,
    volume: c.total_volume ?? 0,
    marketCap: c.market_cap ?? 0,
    galaxyScore: 0, // rempli par LunarCrush si clé fournie
    sparkline: (c.sparkline_in_7d?.price || []).filter((_: number, i: number, arr: number[]) => i % Math.ceil(arr.length / 14) === 0).slice(0, 14)
  }));
}

export async function fetchBtcPrice(): Promise<number | null> {
  try {
    const data = await getJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
    return data?.bitcoin?.eur ?? null;
  } catch { return null; }
}

export async function fetchGlobalMarket(): Promise<GlobalMarket | null> {
  try {
    const data = await getJson('https://api.coingecko.com/api/v3/global');
    const d = data?.data;
    if (!d) return null;
    return {
      totalMcapEur: d.total_market_cap?.eur ?? null,
      btcDominance: d.market_cap_percentage?.btc ?? null,
      change24h: d.market_cap_change_percentage_24h_usd ?? null
    };
  } catch { return null; }
}

// Enrichit les cryptos avec les funding rates des perpétuels (Binance en 1 appel, OKX en secours pour BTC).
// Source pro inspirée de NeoPulse : le funding rate signale la pression acheteurs/vendeurs à effet de levier.
export async function enrichWithFunding(cryptos: CryptoTicker[]): Promise<CryptoTicker[]> {
  try {
    const data = await getJson('https://fapi.binance.com/fapi/v1/premiumIndex');
    if (Array.isArray(data)) {
      const fundingBySym: Record<string, number> = {};
      data.forEach((d: any) => {
        const sym = (d.symbol || '').replace('USDT', '');
        if (sym && d.symbol?.endsWith('USDT')) fundingBySym[sym] = parseFloat(d.lastFundingRate || 0) * 100;
      });
      cryptos.forEach((c) => { if (fundingBySym[c.symbol] !== undefined) c.funding = fundingBySym[c.symbol]; });
    }
  } catch { /* Binance inaccessible : secours OKX pour BTC */ }

  const btc = cryptos.find((c) => c.symbol === 'BTC');
  if (btc && (btc.funding == null)) {
    try {
      const d = await getJson('https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP');
      const f = parseFloat(d?.data?.[0]?.fundingRate || 0) * 100;
      if (f) btc.funding = f;
    } catch { /* tant pis */ }
  }
  return cryptos;
}

// Enrichit les cryptos avec le Galaxy Score LunarCrush (clé perso)
export async function enrichWithLunarCrush(cryptos: CryptoTicker[], lunarKey: string): Promise<CryptoTicker[]> {
  if (!lunarKey) return cryptos;
  await Promise.all(cryptos.map(async (c) => {
    try {
      const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const data = await getJson(`https://lunarcrush.com/api4/public/topic/${encodeURIComponent(slug)}/v1`, {
        headers: { Authorization: `Bearer ${lunarKey}` }
      });
      const score = data?.data?.galaxy_score;
      if (typeof score === 'number') c.galaxyScore = Math.round(score);
    } catch { /* échec isolé : on laisse galaxyScore à 0 */ }
  }));
  return cryptos;
}

// ═══════════════════════════════════════════════════════════
// FEAR & GREED — Alternative.me (gratuit, sans clé)
// ═══════════════════════════════════════════════════════════
export async function fetchFearGreed(): Promise<FearGreed | null> {
  try {
    const data = await getJson('https://api.alternative.me/fng/?limit=1');
    const d = data?.data?.[0];
    if (!d) return null;
    return { value: parseInt(d.value, 10), classification: d.value_classification || '' };
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════
// ACTIONS / ETF — Financial Modeling Prep (clé perso)
// ═══════════════════════════════════════════════════════════
export async function fetchStocks(
  fmpKey: string,
  finnhubKey: string,
  filters: { marketCapMin?: number; sector?: string; exchange?: string; dividend?: boolean }
): Promise<StockTicker[]> {
  if (!fmpKey) throw new Error('Ajoute ta clé FMP dans les réglages pour le screener actions.');
  let url = `https://financialmodelingprep.com/api/v3/stock-screener?apikey=${encodeURIComponent(fmpKey)}&limit=15&isActivelyTrading=true`;
  if (filters.marketCapMin) url += `&marketCapMoreThan=${filters.marketCapMin}`;
  if (filters.sector) url += `&sector=${encodeURIComponent(filters.sector)}`;
  if (filters.exchange) url += `&exchange=${encodeURIComponent(filters.exchange)}`;
  if (filters.dividend) url += `&dividendMoreThan=0`;

  const data = await getJson(url);
  if (!Array.isArray(data)) {
    throw new Error(data?.['Error Message'] || data?.message || 'Réponse FMP inattendue. Vérifie ta clé.');
  }

  const stocks: StockTicker[] = data.map((d: any): StockTicker => ({
    symbol: d.symbol,
    name: d.companyName || d.symbol,
    capitalization: d.marketCap >= 50e9 ? 'Large' : d.marketCap >= 10e9 ? 'Mid' : 'Small',
    sector: d.sector || '—',
    market: d.exchangeShortName || d.exchange || '—',
    dividend: d.lastAnnualDividend > 0 ? 'Oui' : 'Non',
    price: d.price ?? 0,
    change: d.changesPercentage ?? d.change ?? 0,
    rsi: 50,
    macd: 'Neutre',
    maSignal: 'Neutre',
    finalSignal: 'Neutre'
  }));

  // Signal technique agrégé via Finnhub (clé perso)
  if (finnhubKey) {
    await Promise.all(stocks.map(async (s) => {
      try {
        const ta = await getJson(`https://finnhub.io/api/v1/scan/technical-indicator?symbol=${encodeURIComponent(s.symbol)}&resolution=D&token=${encodeURIComponent(finnhubKey)}`);
        const sig = ta?.technicalAnalysis?.signal;
        if (sig === 'buy') { s.finalSignal = 'Achat'; s.macd = 'Achat'; s.maSignal = 'Achat'; }
        else if (sig === 'sell') { s.finalSignal = 'Vente'; s.macd = 'Vente'; s.maSignal = 'Vente'; }
      } catch { /* échec isolé ignoré */ }
    }));
  }
  return stocks;
}

// ═══════════════════════════════════════════════════════════
// MÉTAUX — MetalMetric (gratuit, recherche heuristique)
// ═══════════════════════════════════════════════════════════
export async function fetchMetals(): Promise<MetalPrice[]> {
  const names: Record<string, string> = { gold: 'Or', silver: 'Argent', platinum: 'Platine', palladium: 'Palladium' };
  const data = await getJson('https://metalmetric.com/api/gpt?action=spot_prices&metal=all');
  const results: MetalPrice[] = [];
  for (const key of Object.keys(names)) {
    const found = deepFindMetal(data, key);
    results.push({ name: names[key], symbol: key.toUpperCase().slice(0, 4), price: found.price ?? 0, change: found.change ?? 0 });
  }
  if (results.every((r) => r.price === 0)) throw new Error('Cours des métaux indisponibles pour le moment.');
  return results;
}

function deepFindMetal(obj: any, metalName: string, depth = 0): { price: number | null; change: number | null } {
  if (!obj || typeof obj !== 'object' || depth > 5) return { price: null, change: null };
  const node = typeof obj[metalName] === 'object' ? obj[metalName] : obj;
  const priceKey = Object.keys(node).find((k) => /price|spot|usd|value/i.test(k) && typeof node[k] === 'number');
  const changeKey = Object.keys(node).find((k) => /change|chp|percent/i.test(k) && typeof node[k] === 'number');
  if (priceKey) return { price: node[priceKey], change: changeKey ? node[changeKey] : null };
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object') {
      const sub = deepFindMetal(obj[k], metalName, depth + 1);
      if (sub.price != null) return sub;
    }
  }
  return { price: null, change: null };
}

// ═══════════════════════════════════════════════════════════
// NEWS — Finnhub (clé perso)
// ═══════════════════════════════════════════════════════════
export async function fetchNews(finnhubKey: string, category: string): Promise<NewsItem[]> {
  if (!finnhubKey) throw new Error('Ajoute ta clé Finnhub dans les réglages pour les actualités.');
  const data = await getJson(`https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${encodeURIComponent(finnhubKey)}`);
  if (!Array.isArray(data)) throw new Error('Réponse Finnhub inattendue.');
  const catMap: Record<string, NewsItem['category']> = { general: 'Markets', crypto: 'Crypto', forex: 'Forex', merger: 'M&A' };
  return data.slice(0, 10).map((d: any): NewsItem => ({
    id: String(d.id ?? d.datetime ?? Math.random()),
    title: d.headline || '—',
    category: catMap[category] || 'Markets',
    source: d.source || '',
    time: timeAgo(d.datetime),
    summary: d.summary || '',
    url: d.url || '#'
  }));
}

function timeAgo(unixSeconds: number): string {
  if (!unixSeconds) return '';
  const min = Math.round(Date.now() / 1000 - unixSeconds) / 60 | 0;
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${Math.round(h / 24)} j`;
}

// ═══════════════════════════════════════════════════════════
// BACKTEST HISTORIQUE RÉEL — CoinGecko market_chart (jusqu'à 365j)
// ═══════════════════════════════════════════════════════════
export interface PricePoint { t: number; price: number; mcap: number | null; vol: number | null; }
export interface SliceResult {
  trades: number; wins: number; pnl: number;
  byRegime: Record<Regime, { trades: number; wins: number; pnl: number }>;
}
export interface FullBacktest {
  full: SliceResult; train: SliceResult; valid: SliceResult;
  buyHold: number; isDaily: boolean; points: number;
}

interface BacktestScanner { metric: 'change24h' | 'change7d' | 'volMcapRatio'; condition: 'gte' | 'lte'; value: number; }

function freshRegimeStats(): SliceResult['byRegime'] {
  return { bull: z(), bear: z(), range: z(), highVol: z(), lowVol: z() };
  function z() { return { trades: 0, wins: 0, pnl: 0 }; }
}

export async function fetchCoinHistory(coinId: string, days: number): Promise<PricePoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=eur&days=${days}`;
  const data = await getJson(url);
  if (!Array.isArray(data.prices) || !data.prices.length) {
    throw new Error("Pas de données historiques (l'API publique CoinGecko est parfois limitée en débit, réessaie).");
  }
  return data.prices.map((p: number[], i: number): PricePoint => ({
    t: p[0], price: p[1],
    mcap: data.market_caps?.[i]?.[1] ?? null,
    vol: data.total_volumes?.[i]?.[1] ?? null
  }));
}

function findLookbackIndex(series: PricePoint[], i: number, ms: number): number | null {
  let j = i;
  while (j > 0 && series[i].t - series[j].t < ms) j--;
  return series[i].t - series[j].t >= ms * 0.8 ? j : null;
}

function metricsAt(series: PricePoint[], i: number) {
  const j24 = findLookbackIndex(series, i, 24 * 3600e3);
  const j7d = findLookbackIndex(series, i, 7 * 24 * 3600e3);
  if (j24 == null || j7d == null) return null;
  const change24h = ((series[i].price - series[j24].price) / series[j24].price) * 100;
  const change7d = ((series[i].price - series[j7d].price) / series[j7d].price) * 100;
  const volOk = series[i].vol != null && series[i].mcap != null && (series[i].mcap as number) > 0;
  const volMcapRatio = volOk ? ((series[i].vol as number) / (series[i].mcap as number)) * 100 : 0;
  return { change24h, change7d, volMcapRatio, volMissing: !volOk };
}

function matchScanner(sc: BacktestScanner, m: { change24h: number; change7d: number; volMcapRatio: number }): boolean {
  const v = m[sc.metric];
  return sc.condition === 'gte' ? v >= sc.value : v <= sc.value;
}

function backtestSlice(sc: BacktestScanner, series: PricePoint[], start: number, end: number, minGap: number): SliceResult {
  const out: SliceResult = { trades: 0, wins: 0, pnl: 0, byRegime: freshRegimeStats() };
  let lastSignal = -Infinity;
  for (let i = start; i < end; i++) {
    const m = metricsAt(series, i);
    if (!m) continue;
    if (m.volMissing && sc.metric === 'volMcapRatio') continue;
    if (!matchScanner(sc, m)) continue;
    if (series[i].t - lastSignal < minGap) continue;
    lastSignal = series[i].t;

    const entry = series[i].price, sl = entry * 0.97, tp = entry * 1.05;
    let outcome: string | null = null, exit = entry;
    for (let k = i + 1; k < series.length; k++) {
      if (series[k].price <= sl) { outcome = 'SL'; exit = sl; break; }
      if (series[k].price >= tp) { outcome = 'TP'; exit = tp; break; }
      if (series[k].t - series[i].t > 24 * 3600e3) { outcome = 'EXP'; exit = series[k].price; break; }
    }
    if (!outcome) continue;
    const pnl = ((exit - entry) / entry) * 100;
    const reg = classifyRegime(m.change24h, m.change7d);
    out.trades++; if (pnl > 0) out.wins++; out.pnl += pnl;
    out.byRegime[reg].trades++; if (pnl > 0) out.byRegime[reg].wins++; out.byRegime[reg].pnl += pnl;
  }
  return out;
}

export async function runBacktest(sc: BacktestScanner, coinId: string, days: number): Promise<FullBacktest> {
  const series = await fetchCoinHistory(coinId, days);
  if (series.length < 10) throw new Error('Pas assez de points historiques pour un backtest fiable.');
  const mid = Math.floor(series.length / 2);
  const medianGap = series.length > 2 ? series[mid].t - series[mid - 1].t : 24 * 3600e3;
  const isDaily = medianGap > 6 * 3600e3;
  const minGap = isDaily ? 0 : 12 * 3600e3;
  const splitIdx = Math.floor(series.length * 0.7);

  const train = backtestSlice(sc, series, 0, splitIdx, minGap);
  const valid = backtestSlice(sc, series, splitIdx, series.length, minGap);
  const full = backtestSlice(sc, series, 0, series.length, minGap);
  const buyHold = ((series[series.length - 1].price - series[0].price) / series[0].price) * 100;
  return { full, train, valid, buyHold, isDaily, points: series.length };
}

// ═══════════════════════════════════════════════════════════
// PAPER-TRADING TEMPS RÉEL — ouvre/suit des positions sur vraies données
// ═══════════════════════════════════════════════════════════
export interface LivePaperResult {
  closedTrades: { scannerId: string; scannerName: string; asset: string; entryPrice: number; exitPrice: number; returnPct: number; status: 'WIN' | 'LOSS' }[];
  openedTrades: { scannerId: string; scannerName: string; asset: string; entryPrice: number; coinId: string }[];
  regime: Regime;
}

interface LiveScanner { id: string; name: string; metric: 'change24h' | 'change7d' | 'volMcapRatio'; condition: 'gte' | 'lte'; value: number; isActive: boolean; }
interface OpenPosition { scannerId: string; asset: string; coinId: string; entryPrice: number; sl: number; tp: number; openAt: number; }

// Évalue les scanners sur le marché réel, clôture les positions ouvertes, en ouvre de nouvelles.
export async function livePaperTick(scanners: LiveScanner[], openPositions: OpenPosition[]): Promise<{ result: LivePaperResult; nextOpen: OpenPosition[] }> {
  const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=100&page=1&price_change_percentage=24h,7d';
  const coins = await getJson(url);
  if (!Array.isArray(coins)) throw new Error('Tick: réponse CoinGecko inattendue.');

  const now = Date.now();
  const byId: Record<string, any> = {};
  coins.forEach((c: any) => { byId[c.id] = c; });

  const btc = byId['bitcoin'];
  const regime = btc ? classifyRegime(
    btc.price_change_percentage_24h_in_currency ?? btc.price_change_percentage_24h ?? 0,
    btc.price_change_percentage_7d_in_currency ?? 0
  ) : 'range';

  const closedTrades: LivePaperResult['closedTrades'] = [];
  const stillOpen: OpenPosition[] = [];

  // 1. Suivi des positions ouvertes
  for (const pos of openPositions) {
    const coin = byId[pos.coinId];
    const price = coin?.current_price;
    if (!price) { stillOpen.push(pos); continue; }
    let status: 'WIN' | 'LOSS' | null = null, exit = price;
    if (price <= pos.sl) { status = 'LOSS'; exit = pos.sl; }
    else if (price >= pos.tp) { status = 'WIN'; exit = pos.tp; }
    else if (now - pos.openAt > 24 * 3600e3) { status = exit >= pos.entryPrice ? 'WIN' : 'LOSS'; }
    if (status) {
      const sc = scanners.find(s => s.id === pos.scannerId);
      closedTrades.push({ scannerId: pos.scannerId, scannerName: sc?.name || '?', asset: pos.asset, entryPrice: pos.entryPrice, exitPrice: exit, returnPct: ((exit - pos.entryPrice) / pos.entryPrice) * 100, status });
    } else {
      stillOpen.push(pos);
    }
  }

  // 2. Détection de nouveaux signaux
  const openedTrades: LivePaperResult['openedTrades'] = [];
  for (const sc of scanners.filter(s => s.isActive)) {
    for (const coin of coins) {
      if (!coin.current_price) continue;
      const m = {
        change24h: coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h ?? 0,
        change7d: coin.price_change_percentage_7d_in_currency ?? 0,
        volMcapRatio: coin.market_cap ? (coin.total_volume / coin.market_cap) * 100 : 0
      };
      const v = m[sc.metric];
      const match = sc.condition === 'gte' ? v >= sc.value : v <= sc.value;
      if (!match) continue;
      const dup = stillOpen.find(p => p.scannerId === sc.id && p.coinId === coin.id);
      if (dup) continue;
      const entry = coin.current_price;
      stillOpen.push({ scannerId: sc.id, asset: (coin.symbol || '').toUpperCase(), coinId: coin.id, entryPrice: entry, sl: entry * 0.97, tp: entry * 1.05, openAt: now });
      openedTrades.push({ scannerId: sc.id, scannerName: sc.name, asset: (coin.symbol || '').toUpperCase(), entryPrice: entry, coinId: coin.id });
      break; // un seul nouveau trade par scanner et par tick
    }
  }

  return { result: { closedTrades, openedTrades, regime }, nextOpen: stillOpen };
}
