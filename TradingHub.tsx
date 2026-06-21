import { useState, useEffect, useCallback } from 'react';
import { StockTicker, CryptoTicker, MetalPrice, NewsItem, UserSettings } from '../types.ts';
import { EXTERNAL_SHORTS } from '../mockData.ts';
import {
  fetchCryptos, fetchStocks, fetchMetals, fetchNews, fetchFearGreed, fetchGlobalMarket,
  enrichWithLunarCrush, enrichWithFunding, FearGreed, GlobalMarket
} from '../services/marketData.ts';
import { TrendingUp, TrendingDown, RefreshCw, MessageSquare, ExternalLink, Award, AlertTriangle } from 'lucide-react';

interface TradingHubProps {
  settings: UserSettings;
  btcPrice: number;
  onPostIAComment: (tabName: string, dataContext: any) => void;
  isIAWorking: boolean;
}

export default function TradingHub({ settings, onPostIAComment, isIAWorking }: TradingHubProps) {
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'metals' | 'news'>('crypto');

  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [cryptos, setCryptos] = useState<CryptoTicker[]>([]);
  const [metals, setMetals] = useState<MetalPrice[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [globalMkt, setGlobalMkt] = useState<GlobalMarket | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [capFilter, setCapFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [dividendFilter, setDividendFilter] = useState('ALL');
  const [cryptoCapFilter, setCryptoCapFilter] = useState('ALL');
  const [cryptoVarFilter, setCryptoVarFilter] = useState('ALL');
  const [newsCategory, setNewsCategory] = useState('crypto');

  const loadActiveTab = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (activeTab === 'crypto') {
        const [list, fg, glob] = await Promise.all([fetchCryptos(), fetchFearGreed(), fetchGlobalMarket()]);
        setFearGreed(fg); setGlobalMkt(glob);
        const withFunding = await enrichWithFunding(list);
        setCryptos(settings.lunarCrushKey ? await enrichWithLunarCrush(withFunding, settings.lunarCrushKey) : withFunding);
      } else if (activeTab === 'stocks') {
        const sectorMap: Record<string, string> = { Tech: 'Technology', Automobile: 'Consumer Cyclical', Energy: 'Energy' };
        setStocks(await fetchStocks(settings.fmpKey, settings.finnhubKey, {
          marketCapMin: capFilter === 'Large' ? 50e9 : capFilter === 'Mid' ? 10e9 : undefined,
          sector: sectorFilter !== 'ALL' ? sectorMap[sectorFilter] : undefined,
          dividend: dividendFilter === 'Oui'
        }));
      } else if (activeTab === 'metals') {
        setMetals(await fetchMetals());
      } else if (activeTab === 'news') {
        setNews(await fetchNews(settings.finnhubKey, newsCategory));
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, settings, capFilter, sectorFilter, dividendFilter, newsCategory]);

  useEffect(() => { loadActiveTab(); }, [loadActiveTab]);

  const renderSparkline = (values: number[], change: number) => {
    if (!values || values.length < 2) return <span className="text-[10px] text-slate-300">—</span>;
    const width = 100, height = 30, padding = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    const points = values.map((val, i) => {
      const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg className="w-24 h-8 overflow-visible" width={width} height={height}>
        <polyline fill="none" stroke={change >= 0 ? '#10b981' : '#ef4444'} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  const filteredCryptos = cryptos.filter(c => {
    if (cryptoCapFilter === 'LARGE' && c.marketCap < 20000000000) return false;
    if (cryptoCapFilter === 'MID' && c.marketCap >= 20000000000) return false;
    if (cryptoVarFilter === 'UP' && c.change24h < 0) return false;
    if (cryptoVarFilter === 'DOWN' && c.change24h >= 0) return false;
    return true;
  });

  const handleCommentTab = () => {
    let contextData: any = null, title = '';
    if (activeTab === 'stocks') {
      contextData = stocks.map(s => ({ symbol: s.symbol, name: s.name, price: s.price, chg: s.change, signal: s.finalSignal }));
      title = 'Actions / ETF';
    } else if (activeTab === 'crypto') {
      contextData = {
        bitcoinDominance: globalMkt?.btcDominance != null ? `${globalMkt.btcDominance.toFixed(1)}%` : 'N/A',
        fearAndGreedIndex: fearGreed ? `${fearGreed.value} (${fearGreed.classification})` : 'N/A',
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

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer ${
        activeTab === id ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/15' : 'text-slate-500 hover:text-slate-800'
      }`}
    >{label}</button>
  );

  return (
    <div className="bg-white rounded-[40px] border border-orange-100 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 border-b-8 border-orange-500/20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-orange-100 pb-5">
        <div className="flex bg-orange-50/50 p-1.5 rounded-xl border border-orange-100">
          {tabBtn('crypto', 'Crypto-monnaies')}
          {tabBtn('stocks', 'Actions & ETF')}
          {tabBtn('metals', 'Métaux')}
          {tabBtn('news', 'News')}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadActiveTab} disabled={loading} className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Chargement...' : 'Actualiser'}</span>
          </button>
          <button onClick={handleCommentTab} disabled={isIAWorking} className="bg-teal-500 hover:bg-teal-650 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-teal-500/10">
            <MessageSquare className="w-4.5 h-4.5 shrink-0" />
            <span>{isIAWorking ? 'Commentaire...' : 'iSiA, commente !'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-rose-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'crypto' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Fear &amp; Greed</span>
              <h4 className="text-xl font-black text-orange-600 mt-1">{fearGreed ? `${fearGreed.value} / 100` : '—'}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{fearGreed?.classification || 'En direct'}</p>
            </div>
            <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Dominance BTC</span>
              <h4 className="text-xl font-black text-teal-600 mt-1">{globalMkt?.btcDominance != null ? `${globalMkt.btcDominance.toFixed(1)} %` : '—'}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Part du marché total</p>
            </div>
            <div className="bg-orange-50/40 rounded-2xl p-5 border border-orange-100">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Marché 24h</span>
              <h4 className={`text-xl font-black mt-1 ${(globalMkt?.change24h ?? 0) >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>{globalMkt?.change24h != null ? `${globalMkt.change24h >= 0 ? '+' : ''}${globalMkt.change24h.toFixed(1)}%` : '—'}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Capitalisation globale</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-[#FFF9F5]/40 p-3.5 rounded-[18px] border border-orange-50 text-xs">
            <span className="text-slate-500 font-bold">Filtres :</span>
            <select value={cryptoCapFilter} onChange={(e) => setCryptoCapFilter(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="ALL">Capitalisation (Toutes)</option>
              <option value="LARGE">Large Cap (&gt; 20 Md$)</option>
              <option value="MID">Mid/Small Cap</option>
            </select>
            <select value={cryptoVarFilter} onChange={(e) => setCryptoVarFilter(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="ALL">Variation (Toutes)</option>
              <option value="UP">Hausse 24h</option>
              <option value="DOWN">Baisse 24h</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-orange-100 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-orange-50/60 border-b border-orange-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Actif</th>
                  <th className="p-3.5 text-right">Cours</th>
                  <th className="p-3.5 text-right">Var. 24h</th>
                  <th className="p-3.5 text-right">Var. 7J</th>
                  <th className="p-3.5 text-right">Funding</th>
                  <th className="p-3.5 text-center">Galaxy</th>
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
                    <td className="p-3.5 text-right font-mono text-slate-700 font-semibold">{coin.price.toLocaleString('fr-FR', { minimumFractionDigits: coin.price < 1 ? 3 : 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })} €</td>
                    <td className={`p-3.5 text-right font-mono font-bold ${coin.change24h >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>{coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%</td>
                    <td className={`p-3.5 text-right font-mono font-semibold ${coin.change7d >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>{coin.change7d >= 0 ? '+' : ''}{coin.change7d.toFixed(2)}%</td>
                    <td className="p-3.5 text-right font-mono text-[11px]">
                      {coin.funding != null ? (
                        <span className={coin.funding >= 0 ? 'text-teal-600' : 'text-rose-600'} title="Taux de financement perpétuels (Binance/OKX)">
                          {coin.funding >= 0 ? '+' : ''}{coin.funding.toFixed(4)}%
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-3.5 text-center">
                      {coin.galaxyScore > 0 ? (
                        <div className="inline-flex items-center space-x-1 bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-pink-100 shadow-sm">
                          <Award className="w-3 h-3 text-pink-500" /><span>{coin.galaxyScore}</span>
                        </div>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="p-3.5 text-center flex justify-center">{renderSparkline(coin.sparkline, coin.change7d)}</td>
                  </tr>
                ))}
                {!loading && filteredCryptos.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400 text-xs">Aucun résultat pour ces filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stocks' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 bg-[#FFF9F5]/40 p-3.5 rounded-[18px] border border-orange-50 text-xs">
            <span className="text-slate-500 font-bold">Filtrer par :</span>
            <select value={capFilter} onChange={(e) => setCapFilter(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="ALL">Capitalisation (Toutes)</option>
              <option value="Large">Large Cap (&gt; 50 Md$)</option>
              <option value="Mid">Mid Cap (&gt; 10 Md$)</option>
            </select>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="ALL">Secteurs (Tous)</option>
              <option value="Tech">Technologie</option>
              <option value="Automobile">Conso cyclique</option>
              <option value="Energy">Énergie</option>
            </select>
            <select value={dividendFilter} onChange={(e) => setDividendFilter(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="ALL">Dividende (Indifférent)</option>
              <option value="Oui">Avec dividende</option>
            </select>
          </div>

          {!settings.fmpKey && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs text-orange-700">Ajoute ta clé FMP gratuite dans les réglages ⚙️ pour activer le screener actions.</div>
          )}

          <div className="overflow-x-auto rounded-3xl border border-orange-100 shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-orange-50/60 border-b border-orange-100 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-4">Symbole</th>
                  <th className="p-3.5">Société</th>
                  <th className="p-3.5 text-right">Cours</th>
                  <th className="p-3.5 text-right">Variation</th>
                  <th className="p-3.5 text-center">Secteur</th>
                  <th className="p-3.5 text-center">Signal Technique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 bg-white">
                {stocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-orange-50/20 transition-colors">
                    <td className="p-3.5 pl-4 font-bold font-mono text-orange-600">{stock.symbol}</td>
                    <td className="p-3.5 text-slate-800 font-semibold">{stock.name}</td>
                    <td className="p-3.5 text-right font-mono text-slate-700 font-bold">${stock.price.toFixed(2)}</td>
                    <td className={`p-3.5 text-right font-mono font-black ${stock.change >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>{stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%</td>
                    <td className="p-3.5 text-center text-[11px] text-slate-500 font-semibold">{stock.sector}</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        stock.finalSignal === 'Achat' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                        stock.finalSignal === 'Vente' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>{stock.finalSignal}</span>
                    </td>
                  </tr>
                ))}
                {!loading && stocks.length === 0 && settings.fmpKey && !error && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-xs">Aucun résultat. Élargis tes filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'metals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {metals.map((metal) => (
            <div key={metal.symbol} className="bg-white rounded-3xl p-5 border border-orange-100 hover:border-orange-250 transition-all flex flex-col justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">{metal.symbol}</span>
                <h4 className="text-md sm:text-lg font-black text-slate-900 mt-1">{metal.name}</h4>
              </div>
              <div className="mt-4 flex items-baseline justify-between pt-2 border-t border-orange-50">
                <span className="text-xl font-mono text-slate-800 font-black">${metal.price.toFixed(2)}</span>
                <span className={`inline-flex items-center text-xs font-mono font-bold ${metal.change >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                  {metal.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {metal.change >= 0 ? '+' : ''}{metal.change.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
          {!loading && metals.length === 0 && !error && (
            <div className="col-span-full p-6 text-center text-slate-400 text-xs">Chargement des cours…</div>
          )}
        </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-[#FFF9F5]/40 p-3.5 rounded-[18px] border border-orange-50 text-xs">
            <span className="text-slate-500 font-bold">Catégorie :</span>
            <select value={newsCategory} onChange={(e) => setNewsCategory(e.target.value)} className="bg-white border border-orange-150 px-2.5 py-1.5 rounded-lg text-slate-700 outline-none focus:border-orange-400 font-medium shadow-sm cursor-pointer">
              <option value="general">Marchés</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="merger">Fusions / Acquisitions</option>
            </select>
          </div>
          {!settings.finnhubKey && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs text-orange-700">Ajoute ta clé Finnhub gratuite dans les réglages ⚙️ pour activer les actualités.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-5 border border-orange-100 hover:border-orange-250 transition-all flex flex-col justify-between space-y-3.5 shadow-sm">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-orange-50">
                    <span className="bg-teal-100 text-[9px] text-teal-855 font-mono px-2 py-0.5 rounded border border-teal-200 uppercase font-bold">{item.category}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{item.time} ({item.source})</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-semibold">{item.summary}</p>
                </div>
                <div className="pt-2 border-t border-orange-50">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-650 hover:text-orange-700 hover:underline flex items-center space-x-1 cursor-pointer font-bold">
                    <span>Consulter sur {item.source}</span><ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-orange-100 pt-5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block mb-2 px-1">Accès rapide sites de référence :</span>
        <div className="flex flex-wrap gap-2">
          {EXTERNAL_SHORTS.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-orange-50 text-slate-750 border border-orange-100 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm font-semibold hover:border-orange-250 cursor-pointer">
              <span>{s.name}</span><ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
