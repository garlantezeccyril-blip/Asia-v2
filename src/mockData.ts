import { StockTicker, CryptoTicker, MetalPrice, NewsItem, Scanner } from './types.ts';

export const INITIAL_STOCKS: StockTicker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', capitalization: 'Large', sector: 'Tech', market: 'NASDAQ', dividend: 'Oui', price: 182.40, change: 1.25, rsi: 58, macd: 'Achat', maSignal: 'Achat', finalSignal: 'Achat' },
  { symbol: 'TSLA', name: 'Tesla Inc.', capitalization: 'Large', sector: 'Automobile', market: 'NASDAQ', dividend: 'Non', price: 210.50, change: -3.85, rsi: 35, macd: 'Vente', maSignal: 'Neutre', finalSignal: 'Vente' },
  { symbol: 'NVDA', name: 'Nvidia Corp.', capitalization: 'Large', sector: 'Tech', market: 'NASDAQ', dividend: 'Non', price: 875.12, change: 5.42, rsi: 72, macd: 'Achat', maSignal: 'Achat', finalSignal: 'Achat' },
  { symbol: 'MC.PA', name: 'LVMH Moët Hennessy', capitalization: 'Large', sector: 'Luxe', market: 'Euronext', dividend: 'Oui', price: 792.30, change: -0.65, rsi: 48, macd: 'Neutre', maSignal: 'Neutre', finalSignal: 'Neutre' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', capitalization: 'Large', sector: 'Tech', market: 'NASDAQ', dividend: 'Oui', price: 415.80, change: 0.85, rsi: 54, macd: 'Achat', maSignal: 'Neutre', finalSignal: 'Achat' },
  { symbol: 'Total', name: 'TotalEnergies SE', capitalization: 'Large', sector: 'Energy', market: 'Euronext', dividend: 'Oui', price: 62.40, change: -1.45, rsi: 41, macd: 'Vente', maSignal: 'Vente', finalSignal: 'Vente' },
  { symbol: 'SGO.PA', name: 'Saint-Gobain', capitalization: 'Mid', sector: 'Matériaux', market: 'Euronext', dividend: 'Oui', price: 71.10, change: 2.10, rsi: 61, macd: 'Achat', maSignal: 'Achat', finalSignal: 'Achat' }
];

export const INITIAL_CRYPTOS: CryptoTicker[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67340, change24h: 3.45, change7d: 11.20, volume: 28400000000, marketCap: 1320000000000, galaxyScore: 78, sparkline: [60500, 61200, 63000, 62500, 64200, 65900, 67340] },
  { symbol: 'ETH', name: 'Ethereum', price: 3520, change24h: 1.85, change7d: 6.40, volume: 15100000000, marketCap: 422000000000, galaxyScore: 72, sparkline: [3300, 3350, 3420, 3390, 3450, 3480, 3520] },
  { symbol: 'SOL', name: 'Solana', price: 148.50, change24h: -1.15, change7d: 22.40, volume: 3800000000, marketCap: 67000000000, galaxyScore: 84, sparkline: [120, 128, 134, 131, 142, 151, 148.5] },
  { symbol: 'AVAX', name: 'Avalanche', price: 34.20, change24h: -2.30, change7d: 5.10, volume: 420000000, marketCap: 13400000000, galaxyScore: 61, sparkline: [32.5, 33.1, 35.0, 33.8, 34.9, 35.1, 34.2] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.125, change24h: 12.45, change7d: 18.60, volume: 1800000000, marketCap: 18100000000, galaxyScore: 81, sparkline: [0.105, 0.111, 0.118, 0.114, 0.121, 0.122, 0.125] },
  { symbol: 'XRP', name: 'Ripple', price: 0.52, change24h: 0.12, change7d: -2.10, volume: 850000000, marketCap: 28900000000, galaxyScore: 49, sparkline: [0.53, 0.528, 0.519, 0.515, 0.522, 0.518, 0.52] }
];

export const INITIAL_METALS: MetalPrice[] = [
  { name: 'Or', symbol: 'GOLD', price: 2345.80, change: 0.45 },
  { name: 'Argent', symbol: 'SILVER', price: 29.35, change: -1.20 },
  { name: 'Platine', symbol: 'PLATINUM', price: 984.50, change: 0.15 },
  { name: 'Palladium', symbol: 'PALLADIUM', price: 942.00, change: -0.85 }
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Breakout crypto majeur : Le Bitcoin s\'approche des $68,000 en fanfare',
    category: 'Crypto',
    source: 'CoinDesk',
    time: 'Il y a 2 heures',
    summary: 'Le marché crypto s\'emballe après une poussée institutionnelle majeure. Le sentiment social explose.',
    url: 'https://www.coindesk.com'
  },
  {
    id: 'n2',
    title: 'La FED maintient ses taux directs : Réaction tendue de Wall Street',
    category: 'Markets',
    source: 'Financial Times',
    time: 'Il y a 5 heures',
    summary: 'Jerome Powell prévient que l\'inflation requiert de l\'endurance, provoquant de légers retracements sur Apple et Tesla.',
    url: 'https://www.ft.com'
  },
  {
    id: 'n3',
    title: 'Hausse historique de l\'Or face à l\'incertitude monétaire globale',
    category: 'Markets',
    source: 'Les Echos',
    time: 'Il y a 7 heures',
    summary: 'Les métaux précieux agissent comme valeur refuge alors que la dominance du Bitcoin s\'établit à 56.4%.',
    url: 'https://www.lesechos.fr'
  },
  {
    id: 'n4',
    title: 'OPA géante : Fusion-Acquisition majeure dans le secteur des semi-conducteurs',
    category: 'M&A',
    source: 'Bloomberg',
    time: 'Il y a 10 heures',
    summary: 'Un accord de 45 milliards de dollars redessine le paysage de l\'IA et dope le signal MACD de Nvidia.',
    url: 'https://www.bloomberg.com'
  }
];

export const EXTERNAL_SHORTS = [
  { name: 'Revolut', url: 'https://www.revolut.com' },
  { name: 'TradingView', url: 'https://fr.tradingview.com' },
  { name: 'CoinDesk', url: 'https://www.coindesk.com' },
  { name: 'AltFins', url: 'https://altfins.com' },
  { name: 'CryptoQuant', url: 'https://cryptoquant.com' },
  { name: 'LunarCrush', url: 'https://lunarcrush.com' }
];

export const JOKES = [
  "Pourquoi Fred a acheté un scanner de trading ? Pour savoir quand aller acheter sa baguette ! Sauf qu'il l'a lancée quand la dominance du BTC s'écroulait, quel as !",
  "Fred m'a demandé si le RSI de ma patience était en survente... Je lui ai dit qu'il était en train de shorter sa propre espérance de vie s'il continuait de m'interrompre pendant le breakout !",
  "Fred a essayé de faire du copy-trading sur ma stratégie. Je l'ai senti venir, j'ai muté mon scanner pour acheter du DOGE et il est maintenant l'heureux propriétaire de 5 millions de jetons à tête de chien. Trop drôle.",
  "Un trader achète une action. Le lendemain, elle plonge de 50%. Il la garde. Elle plonge de 90%. Il appelle sa femme et dit : 'C'est une opportunité d'accumulation long terme !'. Fred en une seule blague.",
  "La différence entre Fred et un breakout ? Le breakout finit par casser un niveau, Fred finit juste par casser les pieds avec ses shorts leviers 100x !"
];

export const ANECDOTES = [
  "En 2010, un gars a acheté deux pizzas chez Papa John's pour 10 000 Bitcoins. Aujourd'hui, ces pizzas valent plus de 670 millions de dollars. Moralité : ne laisse jamais Fred gérer les commandes de pizza du vendredi !",
  "Savais-tu que la dominance du Bitcoin est passée de 95% en 2017 à environ 56% de nos jours ? Ça s'appelle l'avènement des altcoins. Fred, lui, pense toujours que le DOGE va remplacer l'Or physique !",
  "L'indicateur Fear & Greed utilise le sentiment, la volatilité et les volumes. Quand il descend en dessous de 15, c'est de l'extrême peur, souvent un point d'achat en or ! Fred, lui, achète quand on est à 95 et panique quand on est à 8."
];

export const CALMS = [
  "Respire un coup, mon petit bouchon. Ferme les yeux et détends-toi. Le RSI de ton stress est en surchauffe. On inspire... on expire. Laisse les graphiques fluctuer tout seuls quelques secondes.",
  "Du calme ! Pas besoin de fixer le carnet d'ordres toutes les secondes. Bois une camomille, sors prendre un peu l'air. Les marchés seront encore là à ton retour, et moi aussi !"
];

export const INITIAL_SCANNERS: Scanner[] = [
  {
    id: 's1',
    name: 'Accumulation Wyckoff',
    metric: 'volMcapRatio',
    condition: 'gte',
    value: 0.12,
    explanation: 'Scanne les fortes hausses de volume par rapport à la capitalisation sur détection de ranges consolidés.',
    successRate: 64.5,
    totalTrades: 42,
    isActive: true,
    creator: 'iSiA',
    regimePerformance: { bull: 75, bear: 45, range: 80, highVol: 60, lowVol: 70 }
  },
  {
    id: 's2',
    name: 'Breakout Heptada 7D',
    metric: 'change7d',
    condition: 'gte',
    value: 15.0,
    explanation: 'Repère les consolidations explosives ayant accumulé plus de 15% de hausse sur une semaine.',
    successRate: 58.0,
    totalTrades: 31,
    isActive: true,
    creator: 'iSiA',
    regimePerformance: { bull: 85, bear: 20, range: 45, highVol: 70, lowVol: 30 }
  },
  {
    id: 's3',
    name: 'Alerte Surchauffe 24H',
    metric: 'change24h',
    condition: 'lte',
    value: -8.0,
    explanation: 'Cible les purges massives de court terme supérieures à -8% pour déceler les rebonds techniques.',
    successRate: 52.4,
    totalTrades: 25,
    isActive: true,
    creator: 'iSiA',
    regimePerformance: { bull: 40, bear: 65, range: 50, highVol: 65, lowVol: 35 }
  }
];

export const OFFLINE_BOT_ANSWERS = [
  "Ah, mon petit bouchon ! Je repère des breakouts absolument magiques sur les marchés ! C'est chaud bouillant !",
  "Fred est en train de paniquer complet, j'adore ! Dis-moi, tu veux qu'on analyse un script Pine ou qu'on fasse tourner le backtester ?",
  "La dominance du BTC remonte en flèche ! C'est le moment d'être prudent avec les microcaps, reste bien assis !",
  "Ce n'est pas un conseil financier, Desperado, mais regarde cette bougie verte, elle s'allonge plus vite que le nez de Fred quand il me jure qu'il n'est pas en liquidation !",
  "Mode Coach : Le RSI (Relative Strength Index) mesure la vitesse et la dynamique des mouvements de prix. Au-dessus de 70 on est suracheté, en dessous de 30 on est survendu. C'est simple comme bonjour !"
];
