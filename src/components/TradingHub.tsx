import { useState } from 'react';
import { StockTicker, CryptoTicker, MetalPrice, NewsItem, UserSettings } from '../types.ts';
import { INITIAL_STOCKS, INITIAL_CRYPTOS, INITIAL_METALS, INITIAL_NEWS, EXTERNAL_SHORTS } from '../mockData.ts';
import { TrendingUp, TrendingDown, RefreshCw, MessageSquare, ExternalLink, ShieldAlert, Award } from 'lucide-react';

interface TradingHubProps {
  settings: UserSettings;
  btcPrice: number;
  onPostIAComment: (tabName: string, dataContext: any) => void;
  isIAWorking: boolean;
}

export default function TradingHub({ settings, btcPrice, onPostIAComment, isIAWorking }: TradingHubProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'metals' | 'news'>('crypto');
  
  // Real-time local multipliers (simulating tick price movements)
  const [stocks, setStocks] = useState<StockTicker[]>(INITIAL_STOCKS);
  const [cryptos, setCryptos] = useState<CryptoTicker[]>(() => {
    return INITIAL_CRYPTOS.map(c => c.symbol === 'BTC' ? { ...c, price: btcPrice } : c);
  });
  const [metals, setMetals] = useState<MetalPrice[]>(INITIAL_METALS);
  const [news] = useState<NewsItem[]>(INITIAL_NEWS);

  // Filters for STOCKS
  const [capFilter, setCapFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [dividendFilter, setDividendFilter] = useState<string>('ALL');

  // Filters for CRYPTO
  const [cryptoCapFilter, setCryptoCapFilter] = useState<string>('ALL');
  const [cryptoVarFilter, setCryptoVarFilter] = useState<string>('ALL');

  // Sparkline SVG generator
  const renderSparkline = (values: number[], change: number) => {
    const width = 100;
    const height = 30;
    const padding = 2;
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const points = values.map((val, i) => {
      const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = change >= 0 ? '#10b981' : '#ef4444';

    return (
      <svg className="w-24 h-8 overflow-visible" width={width} height={height}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  // Filter handlers
  const filteredStocks = stocks.filter(s => {
    if (capFilter !== 'ALL' && s.capitalization !== capFilter) return false;
    if (sectorFilter !== 'ALL' && s.sector !== sectorFilter) return false;
    if (dividendFilter !== 'ALL' && s.dividend !== dividendFilter) return false;
    return true;
  });

  const filteredCryptos = cryptos.filter(c => {
    if (cryptoCapFilter === 'LARGE' && c.marketCap < 20000000000) return false;
    if (cryptoCapFilter === 'MID' && c.marketCap >= 20000000000) return false;
    if (cryptoVarFilter === 'UP' && c.change24h < 0) return false;
    if (cryptoVarFilter === 'DOWN' && c.change24h >= 0) return false;
    return true;
  });

  // Call commentary for active tab
  const handleCommentTab = () => {
    let contextData: any = null;
    let title = '';

    if (activeTab === 'stocks') {
      contextData = filteredStocks.map(s => ({ symbol: s.symbol, name: s.name, price: s.price, chg: s.change, signal: s.finalSignal }));
      title = 'Actions / ETF';
    } else if (activeTab === 'crypto') {
      contextData = {
        bitcoinDominance: '56.4%',
        fearAndGreedIndex: '74 (Greed)',
        listings: filteredCryptos.map(c => ({ symbol: c.symbol, name: c.name, price: c.price, change24h: c.change24h, socialSentimentGalaxyScore: c.galaxyScore }))
      };
      title = 'Crypto-monnaies';
    } else if (activeTab === 'metals') {
      contextData = metals.map(m => ({ metal: m.name, symbol: m.symbol, price: m.price, variation: m.change }));
      title = 'Métaux Précieux';
    } else if (activeTab === 'news') {
      contextData = news.map(n => ({ source: n.source, category: n.category, title: n.title, resume: n.summary }));
      title = 'Actualités financières';
    }

    onPostIAComment(title, contextData);
  };

  return (
    <div className="bg-white rounded-[40px] border border-orange-100 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 border-b-8 border-orange-500/20">
      {/* Tab Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 pb-5">
        <div className="flex bg-orange-50/50 p-1.5 rounded-xl border border-orange-100">
          <button
            onClick={() => setActiveTab('crypto')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'crypto'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Crypto-monnaies
          </button>
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'stocks'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Actions & ETF
          </button>
          <button
            onClick={() => setActiveTab('metals')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'metals'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Métaux
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'news'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            News
          </button>
        </div>

        {/* Action Button: AI Comment on current Tab */}
        <button
          onClick={handleCommentTab}
          disabled={isIAWorking}
          className="bg-teal-500 hover:bg-teal-650 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-500/10"
        >
          <MessageSquare className="w-4.5 h-4.5 shrink-0" />
          <span>{isIAWorking ? 'Commentaire...' : 'iSiA, commente cet onglet !'}</span>
        </button>
      </div>

      {/* --- Tab 1: CRYPTO --- */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          {/* Global Indices Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fear & Greed Index */}
            <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Indice Fear & Greed</span>
                <h4 className="text-xl font-black text-orange-600 mt-1">74 / 100</h4>
                <p className="text-[11px] text-slate-500 font-medium">Régime actuel : <span className="text-pink-600 font-bold">Sur-Achat / Greed intense</span></p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-orange-500/15 border-r-orange-500 flex items-center justify-center text-xs font-bold text-orange-600">
                74%
              </div>
            </div>

            {/* Bitcoin Dominance */}
            <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Dominance du Bitcoin</span>
                <h4 className="text-xl font-black text-teal-600 mt-1">56.4 %</h4>
                <p className="text-[11px] text-slate-500 font-medium">Indique le repli des capitaux alternatifs.</p>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-teal-500/15 border-t-teal-500 flex items-center justify-center text-xs font-bold text-teal-600">
                56%
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-[#FFF9F5]/40 p-3.5 rounded-[18px] border border-orange-50 text-xs">
            <span className="text-slate-500 font-bold">Filtres :</span>
            <select
              value={cryptoCapFilter}
              onChange={(e) => setCryptoCapFilter(e.target.value)}
              className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer"
            >
              <option value="ALL">Capitalisation (Toutes)</option>
              <option value="LARGE">Large Cap (&gt; $20M)</option>
              <option value="MID">Mid Cap (&lt; $20M)</option>
            </select>
            <select
              value={cryptoVarFilter}
              onChange={(e) => setCryptoVarFilter(e.target.value)}
              className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer"
            >
              <option value="ALL">Variation (Toutes)</option>
              <option value="UP">Hausse 24h</option>
              <option value="DOWN">Baisse 24h</option>
            </select>
          </div>

          {/* Crypto Table */}
          <div className="overflow-x-auto rounded-3xl border border-orange-100 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-orange-50/60 border-b border-orange-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Actif</th>
                  <th className="p-3.5 text-right">Cours</th>
                  <th className="p-3.5 text-right">Var. 24h</th>
                  <th className="p-3.5 text-right">Var. 7J</th>
                  <th className="p-3.5 text-center">Galaxy Score</th>
                  <th className="p-3.5 text-center">Graphe 7J</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white">
                {filteredCryptos.map((coin) => (
                  <tr key={coin.symbol} className="hover:bg-orange-50/20 transition-colors">
                    <td className="p-3.5 pl-4 font-bold text-slate-800 flex items-center space-x-2">
                      <span className="bg-orange-100 p-1 px-1.5 rounded-lg font-bold font-mono text-[10px] text-orange-600">{coin.symbol}</span>
                      <span className="font-semibold">{coin.name}</span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700 font-semibold">
                      ${coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price < 1 ? 3 : 2 })}
                    </td>
                    <td className={`p-3.5 text-right font-mono font-bold ${coin.change24h >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                      {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </td>
                    <td className={`p-3.5 text-right font-mono font-semibold ${coin.change7d >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                      {coin.change7d >= 0 ? '+' : ''}{coin.change7d.toFixed(2)}%
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center space-x-1 bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-pink-100 shadow-sm">
                        <Award className="w-3 h-3 text-pink-500" />
                        <span>{coin.galaxyScore} / 100</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-center flex justify-center">
                      {renderSparkline(coin.sparkline, coin.change7d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab 2: ACTIONS & ETF --- */}
      {activeTab === 'stocks' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-[#FFF9F5]/40 p-3.5 rounded-[18px] border border-orange-50 text-xs">
            <span className="text-slate-500 font-bold">Filtrer par :</span>
            <select
              value={capFilter}
              onChange={(e) => setCapFilter(e.target.value)}
              className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer"
            >
              <option value="ALL">Large/Mid Capitalisations</option>
              <option value="Large">Large Cap (&gt; $50M)</option>
              <option value="Mid">Mid Cap (&lt; $50M)</option>
            </select>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer"
            >
              <option value="ALL">Secteurs (Tous)</option>
              <option value="Tech">Technologie</option>
              <option value="Automobile">Automobile</option>
              <option value="Luxe">Luxe</option>
              <option value="Energy">Énergie / Pétrole</option>
            </select>
            <select
              value={dividendFilter}
              onChange={(e) => setDividendFilter(e.target.value)}
              className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer"
            >
              <option value="ALL">Dividende (Indifférent)</option>
              <option value="Oui">Oui</option>
              <option value="Non">Non</option>
            </select>
          </div>

          {/* Stocks Tables */}
          <div className="overflow-x-auto rounded-3xl border border-orange-100 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-orange-50/60 border-b border-orange-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Symbole</th>
                  <th className="p-3.5">Société</th>
                  <th className="p-3.5 text-right">Cours</th>
                  <th className="p-3.5 text-right">Variation</th>
                  <th className="p-3.5 text-center">RSI</th>
                  <th className="p-3.5 text-center">MACD</th>
                  <th className="p-3.5 text-center">Signal Technique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white">
                {filteredStocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-orange-50/20 transition-colors">
                    <td className="p-3.5 pl-4 font-bold font-mono text-orange-600">{stock.symbol}</td>
                    <td className="p-3.5 text-slate-800 font-semibold">{stock.name}</td>
                    <td className="p-3.5 text-right font-mono text-slate-700 font-bold">${stock.price.toFixed(2)}</td>
                    <td className={`p-3.5 text-right font-mono font-black ${stock.change >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        stock.rsi > 70 ? 'bg-rose-100 text-rose-700 font-bold' :
                        stock.rsi < 30 ? 'bg-teal-100 text-teal-700 font-bold' :
                        'bg-slate-100 text-slate-500 shadow-inner'
                      }`}>
                        {stock.rsi}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-xs font-bold">
                      <span className={stock.macd === 'Achat' ? 'text-teal-605' : stock.macd === 'Vente' ? 'text-rose-605' : 'text-slate-400'}>
                        {stock.macd}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        stock.finalSignal === 'Achat' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                        stock.finalSignal === 'Vente' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {stock.finalSignal}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab 3: METALS --- */}
      {activeTab === 'metals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {metals.map((metal) => (
            <div key={metal.symbol} className="bg-white rounded-3xl p-5 border border-orange-100 hover:border-orange-250 hover:bg-orange-50/10 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">{metal.symbol}</span>
                <h4 className="text-md sm:text-lg font-black text-slate-900 mt-1">{metal.name}</h4>
              </div>
              <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-orange-50">
                <span className="text-xl font-mono text-slate-800 font-black">${metal.price.toFixed(2)}</span>
                <span className={`inline-flex items-center text-xs font-mono font-bold ${metal.change >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                  {metal.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {metal.change >= 0 ? '+' : ''}{metal.change}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Tab 4: NEWS --- */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-orange-100 hover:border-orange-250 hover:bg-orange-50/10 transition-all flex flex-col justify-between space-y-3.5 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-orange-50">
                  <span className="bg-teal-100 text-[9px] text-teal-855 font-mono px-2 py-0.5 rounded border border-teal-200 uppercase font-bold">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{item.time} ({item.source})</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 truncate line-clamp-2">{item.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-semibold">{item.summary}</p>
              </div>
              <div className="pt-2 border-t border-orange-50 flex items-center justify-between">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-650 hover:text-orange-700 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                >
                  <span>Consulter sur {item.source}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Market Quick Shortcuts Bar */}
      <div className="border-t border-orange-100 pt-5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block mb-2 px-1">Accès rapide sites de référence :</span>
        <div className="flex flex-wrap gap-2">
          {EXTERNAL_SHORTS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-orange-50 text-slate-750 border border-orange-100 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm font-semibold hover:border-orange-250 cursor-pointer"
            >
              <span>{s.name}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
