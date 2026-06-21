export interface UserSettings {
  nickname: string;
  selectedAffection: string;
  coachMode: boolean;
  intelligentAlerts: boolean;
  systemSpeech: boolean;
  fmpKey: string;
  finnhubKey: string;
  lunarCrushKey: string;
  groqKey: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StockTicker {
  symbol: string;
  name: string;
  capitalization: 'Large' | 'Mid' | 'Small';
  sector: string;
  market: string;
  dividend: 'Oui' | 'Non';
  price: number;
  change: number; // percentage
  rsi: number;
  macd: 'Achat' | 'Neutre' | 'Vente';
  maSignal: 'Achat' | 'Neutre' | 'Vente';
  finalSignal: 'Achat' | 'Neutre' | 'Vente';
}

export interface CryptoTicker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: number;
  marketCap: number;
  galaxyScore: number; // 0-100
  sparkline: number[]; // 7 data points
  funding?: number | null; // taux de financement perpétuels (%), source Binance/OKX
}

export interface MetalPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Markets' | 'Crypto' | 'Forex' | 'M&A';
  source: string;
  time: string;
  summary: string;
  url: string;
}

export interface Scanner {
  id: string;
  name: string;
  metric: 'change24h' | 'change7d' | 'volMcapRatio';
  condition: 'gte' | 'lte';
  value: number;
  explanation: string;
  successRate: number; // percentage
  totalTrades: number;
  isActive: boolean;
  creator: 'User' | 'iSiA' | 'PineScript';
  regimePerformance: {
    bull: number;
    bear: number;
    range: number;
    highVol: number;
    lowVol: number;
  };
}

export interface PaperTrade {
  id: string;
  scannerName: string;
  asset: string;
  entryPrice: number;
  currentPrice: number;
  returnPct: number;
  status: 'OPEN' | 'WIN' | 'LOSS';
  timestamp: string;
}

export interface BacktestResult {
  assetName: string;
  scannerName: string;
  buyAndHoldReturn: number;
  scannerReturn: number;
  pvalue: number; // statistical confidence
  confidenceLevel: string; // text e.g. "95% de confiance"
  totalTrades: number;
  winRate: number;
  overfittingIndex: number; // score 0-100 (high = overfitting in training vs validation)
  trainingPath: { date: string; price: number; equity: number }[];
  validationPath: { date: string; price: number; equity: number }[];
}
