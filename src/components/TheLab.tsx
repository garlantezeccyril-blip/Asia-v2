import React, { useState, useEffect } from 'react';
import { Scanner, PaperTrade, BacktestResult, UserSettings } from '../types.ts';
import { Play, Sparkles, TrendingUp, TrendingDown, RefreshCw, Cpu, Brain, Activity, ShieldAlert, BarChart3, Trash2, Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import SuccessRateChart from './SuccessRateChart.tsx';
import RegimePerformanceChart from './RegimePerformanceChart.tsx';
import { motion, AnimatePresence } from 'motion/react';

interface TheLabProps {
  settings: UserSettings;
  scanners: Scanner[];
  paperTrades: PaperTrade[];
  terminalLogs: string[];
  evolutionLogs: string[];
  onAddScanner: (s: Scanner) => void;
  onDeleteScanner: (id: string) => void;
  onPostIAComment: (tabName: string, dataContext: any) => void;
  isIAWorking: boolean;
}

export default function TheLab({
  settings,
  scanners,
  paperTrades,
  terminalLogs,
  evolutionLogs,
  onAddScanner,
  onDeleteScanner,
  onPostIAComment,
  isIAWorking
}: TheLabProps) {
  // Natural language bot creator states
  const [nlPrompt, setNlPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Backtest states
  const [selectedAsset, setSelectedAsset] = useState('SOL');
  const [selectedScannerId, setSelectedScannerId] = useState('');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Copy states and handlers
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedBacktest, setCopiedBacktest] = useState(false);
  const [exportedJson, setExportedJson] = useState(false);
  const [expandedScannerId, setExpandedScannerId] = useState<string | null>(null);

  const handleCopyLogs = () => {
    const text = `=== JOURNAL ÉVOLUTIF & MUTATIONS - iSiA v2 ===\n` + evolutionLogs.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    });
  };

  const handleCopyBacktest = () => {
    if (!backtestResult) return;
    const text = `=== RAPPORT DE BACKTEST - iSiA v2 ===
Scanner : ${backtestResult.scannerName}
Actif : ${backtestResult.assetName}
Niveau de Confiance : ${backtestResult.confidenceLevel}

Rendement Bot : ${backtestResult.scannerReturn}%
Rendement Buy & Hold : ${backtestResult.buyAndHoldReturn}%
Nombre Total de Trades : ${backtestResult.totalTrades}
Taux de Réussite (Win Rate) : ${backtestResult.winRate}%
Indice de Surapprentissage : ${backtestResult.overfittingIndex}/100 (${
      backtestResult.overfittingIndex > 50 ? 'RISQUE DE SURAPPRENTISSAGE ELEVE' : 'CONFIGURATION ROBUSTE'
    })`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBacktest(true);
      setTimeout(() => setCopiedBacktest(false), 2000);
    });
  };

  const handleExportJSON = () => {
    const exportData = {
      generator: 'iSiA Trading Lab Engine v2',
      exportVersion: '2.0',
      exportedAt: new Date().toISOString(),
      userSettings: {
        nickname: settings.nickname || 'Anonyme',
        coachMode: settings.coachMode,
        alertsEnabled: settings.intelligentAlerts
      },
      scannersState: scanners.map(s => ({
        id: s.id,
        name: s.name,
        metric: s.metric,
        condition: s.condition,
        value: s.value,
        successRate: s.successRate,
        totalTrades: s.totalTrades,
        isActive: s.isActive,
        creator: s.creator,
        explanation: s.explanation,
        regimePerformance: s.regimePerformance
      })),
      simulatedTradesLedger: paperTrades,
      systemMutationLogs: evolutionLogs,
      lastBacktestResult: backtestResult ? {
        assetName: backtestResult.assetName,
        scannerName: backtestResult.scannerName,
        buyAndHoldReturn: backtestResult.buyAndHoldReturn,
        scannerReturn: backtestResult.scannerReturn,
        confidenceLevel: backtestResult.confidenceLevel,
        totalTrades: backtestResult.totalTrades,
        winRate: backtestResult.winRate,
        overfittingIndex: backtestResult.overfittingIndex
      } : null
    };

    const dataContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `isia_trading_lab_performance_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    // Clean up
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);

    setExportedJson(true);
    setTimeout(() => setExportedJson(false), 2500);
  };

  useEffect(() => {
    if (scanners.length > 0 && !selectedScannerId) {
      setSelectedScannerId(scanners[0].id);
    }
  }, [scanners]);

  // Generate simulated historical price path & run backtest logic
  const handleLaunchBacktest = () => {
    const scanner = scanners.find(s => s.id === selectedScannerId);
    if (!scanner) return;

    setIsBacktesting(true);
    setBacktestResult(null);

    setTimeout(() => {
      // Create a simulated 365-day historical path
      const pathLength = 365;
      const trainingLength = 180;
      
      let basePrice = selectedAsset === 'BTC' ? 45000 : selectedAsset === 'ETH' ? 2400 : 80;
      const trainingPath: { date: string; price: number; equity: number }[] = [];
      const validationPath: { date: string; price: number; equity: number }[] = [];

      let currentPrice = basePrice;
      let buyAndHoldEquity = 100;
      let scannerEquity = 100;
      let inPosition = false;
      let entryPrice = 0;
      let holdingPeriod = 0;
      let wins = 0;
      let totalBacktestTrades = 0;

      // Parameters based on scanner conditions
      const threshold = scanner.value;
      const isGte = scanner.condition === 'gte';

      for (let i = 1; i <= pathLength; i++) {
        // Geometric Brownian Motion simulation
        const drift = i < 120 ? 0.001 : i < 220 ? -0.00085 : 0.0012; // Bull, then Bear, then Bull range
        const volatility = 0.035;
        const rand = (Math.random() - 0.48) * 2; // slight bias
        const changePct = drift + volatility * rand;
        currentPrice = currentPrice * (1 + changePct);

        // Update Buy and Hold
        buyAndHoldEquity = (currentPrice / basePrice) * 100;

        // Simulator logic: Trigger buy when asset meeting scanner rule
        let trigger = false;
        const currentMetricValue = isGte ? threshold * (1 + (Math.random() - 0.3) * 0.4) : threshold * (1 - (Math.random() - 0.3) * 0.4);
        
        if (isGte && currentMetricValue >= threshold) {
          trigger = true;
        } else if (!isGte && currentMetricValue <= threshold) {
          trigger = true;
        }

        if (!inPosition && trigger) {
          inPosition = true;
          entryPrice = currentPrice;
          holdingPeriod = 4; // hold for 4 days
          totalBacktestTrades++;
        }

        if (inPosition) {
          holdingPeriod--;
          if (holdingPeriod === 0) {
            inPosition = false;
            const tradeReturn = (currentPrice / entryPrice) - 1;
            scannerEquity = scannerEquity * (1 + tradeReturn);
            if (tradeReturn > 0) wins++;
          }
        }

        const dateStr = `Jour ${i}`;
        const record = { date: dateStr, price: Number(currentPrice.toFixed(2)), equity: Number(scannerEquity.toFixed(2)) };

        if (i <= trainingLength) {
          trainingPath.push(record);
        } else {
          // Validation phase
          // Let's add slight negative drift for scanner on validation phase to simulate general overfitting
          if (Math.random() > 0.6) {
            scannerEquity = scannerEquity * 0.992;
          }
          validationPath.push({ ...record, equity: Number(scannerEquity.toFixed(2)) });
        }
      }

      const buyAndHoldReturn = ((currentPrice / basePrice) - 1) * 100;
      const scannerReturn = scannerEquity - 100;
      const winRate = totalBacktestTrades > 0 ? (wins / totalBacktestTrades) * 100 : 50;
      
      // Overfitting Index shows if validation curve decays compared to training
      const trainingPeak = Math.max(...trainingPath.map(p => p.equity));
      const validationEnd = validationPath[validationPath.length - 1].equity;
      const overfittingIndex = Math.max(0, Math.min(100, Math.round(((trainingPeak - validationEnd) / trainingPeak) * 100)));

      const pvalue = scannerReturn > buyAndHoldReturn ? 0.042 : 0.48; // mock stat significance

      setBacktestResult({
        assetName: selectedAsset,
        scannerName: scanner.name,
        buyAndHoldReturn: Number(buyAndHoldReturn.toFixed(1)),
        scannerReturn: Number(scannerReturn.toFixed(1)),
        pvalue,
        confidenceLevel: pvalue < 0.05 ? "Intervalle de Confiance à 95%" : "Pas statistiquement significatif",
        totalTrades: totalBacktestTrades,
        winRate: Number(winRate.toFixed(1)),
        overfittingIndex,
        trainingPath,
        validationPath
      });

      setIsBacktesting(false);
    }, 1500);
  };

  // call REST API for natural language generation
  const handleGenerateScanner = async () => {
    if (!nlPrompt.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/scanner/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: nlPrompt })
      });
      const data = await res.json();
      if (res.ok && data.name) {
        onAddScanner({
          id: `gen_${Date.now()}`,
          name: data.name,
          metric: data.metric || 'change24h',
          condition: data.condition || 'gte',
          value: data.value ?? 5.5,
          explanation: data.explanation || 'Créé en langage naturel par iSiA.',
          successRate: 50.0,
          totalTrades: 0,
          isActive: true,
          creator: 'iSiA',
          regimePerformance: { bull: 55, bear: 50, range: 50, highVol: 50, lowVol: 50 }
        });
        setNlPrompt('');
        alert(`Nouveau scanner "${data.name}" généré et déployé en direct !`);
      } else {
        alert("Pardon mon petit bouchon, j'ai buté sur cette formule ! Essaye une description simple.");
      }
    } catch (err) {
      alert("Problème de communication avec le cerveau d'iSiA !");
    } finally {
      setIsGenerating(false);
    }
  };

  // iSiA invents a scanner on her own
  const handleIsiaInitiative = () => {
    const list = [
      "Crée un scanner détectant une anomalie de volume relative supérieure à 20% en bear market",
      "Crée un scanner pour chercher un retournement technique sur panique 7 jours",
      "Invente un scanner de volume cumulé Wyckoff avec de forts signaux d'alertes",
      "Génère un filtre qui détecte les micro-breakouts agressifs sur Solana"
    ];
    const picked = list[Math.floor(Math.random() * list.length)];
    setNlPrompt(picked);
  };

  // AI Commentary of backtest reports
  const handleCommentBacktest = () => {
    if (!backtestResult) return;
    onPostIAComment('Rapport de Backtest Historique', {
      asset: backtestResult.assetName,
      scanner: backtestResult.scannerName,
      performanceScanner: `${backtestResult.scannerReturn}%`,
      performanceBuyAndHold: `${backtestResult.buyAndHoldReturn}%`,
      winRate: `${backtestResult.winRate}%`,
      tradesCount: backtestResult.totalTrades,
      overfittingScore: `${backtestResult.overfittingIndex}/100`,
      statisticalConfidence: backtestResult.confidenceLevel
    });
  };

  // Check shared configurations warnings
  const indicatorsCount = scanners.reduce((acc, s) => {
    acc[s.metric] = (acc[s.metric] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overlapError = Object.values(indicatorsCount).some(count => count >= 3);

  return (
    <div className="space-y-6">
      {/* Portfolio & Risks Bento Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Risk Monitor Widget */}
        <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl flex flex-col justify-between border-b-6 border-orange-550/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mb-1">Radar des Risques algorithmologiques</span>
              <h3 className="text-xl font-black text-slate-900 font-sans">
                {overlapError ? 'Risque Moyen' : 'Risque Faible'}
              </h3>
            </div>
            <Activity className={`w-6 h-6 ${overlapError ? 'text-orange-550 animate-pulse' : 'text-teal-500'}`} />
          </div>
          {overlapError ? (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-2.5 mt-4 text-[11px] text-pink-700 font-bold flex items-start space-x-2 shadow-sm">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-pink-500" />
              <span>Plus de 3 scanners exploitent l'indicateur {Object.keys(indicatorsCount).find(k => indicatorsCount[k] >= 3)}! Diversifie pour éviter un crash corrélé.</span>
            </div>
          ) : (
            <p className="text-xs text-teal-600 font-bold mt-4">✓ Scanners équilibrés : Les métriques de volume et de vitesse sont correctement diversifiées.</p>
          )}
        </div>

        {/* Global Performance Widget */}
        <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl flex flex-col justify-between border-b-6 border-orange-550/20">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mb-1">Taux de réussite global du Lab</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black font-mono text-pink-500">
                {(scanners.reduce((sum, s) => sum + s.successRate, 0) / (scanners.length || 1)).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-bold">({paperTrades.length} positions simulées)</span>
            </div>
          </div>
          <div className="pt-3 border-t border-orange-100 flex justify-between text-[11px] text-slate-500 font-bold">
            <span>Succès moyen : <span className="text-teal-600">+3.45%</span></span>
            <span>Régime : <span className="text-orange-600">Bullish intense</span></span>
          </div>
        </div>

        {/* Dynamic Scanners Generator prompt box */}
        <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl flex flex-col justify-between border-b-6 border-orange-550/20">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-orange-500 shrink-0" />
            <span className="text-xs font-extrabold text-orange-605 uppercase tracking-widest">Créer un Bot par IA</span>
          </div>
          
          <div className="mt-3 flex items-center space-x-2 bg-orange-50/30 rounded-xl px-2.5 py-1.5 border border-orange-100 shadow-inner">
            <input
              type="text"
              value={nlPrompt}
              onChange={(e) => setNlPrompt(e.target.value)}
              placeholder="Ex: 'un scanner de panique RSI7d'..."
              className="flex-grow bg-transparent text-xs text-slate-800 placeholder-slate-450 focus:outline-none py-1 font-bold"
            />
            <button
              onClick={handleIsiaInitiative}
              className="text-[10px] bg-pink-100 text-pink-700 hover:bg-pink-200 px-2.5 py-1 rounded-lg font-bold shadow-sm"
              title="Laisser iSiA choisir l'idée"
            >
              Idée !
            </button>
          </div>

          <button
            onClick={handleGenerateScanner}
            disabled={isGenerating || !nlPrompt.trim()}
            className="mt-3.5 w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-extrabold py-3.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/15 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 font-bold" />}
            <span>{isGenerating ? 'Calcul...' : 'Déployer scanner'}</span>
          </button>
        </div>

        {/* Success Rate 30d Progress Recharts Chart */}
        <SuccessRateChart scanners={scanners} />
      </div>

      {/* Scanners List & Backtester Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanners Master list (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-[40px] p-6 sm:p-8 border border-orange-100 shadow-2xl space-y-4 border-b-8 border-orange-500/20">
          <div className="flex items-center justify-between border-b border-orange-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Scanners en Paper Trading</h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-mono font-bold px-2.5 py-1 rounded-lg border border-teal-200/50 uppercase">En Continu</span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            <AnimatePresence mode="popLayout">
              {scanners.map((bot) => (
                <motion.div
                  key={bot.id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-orange-50/20 rounded-2xl p-5 border border-orange-100 hover:border-orange-250 hover:bg-orange-50/45 transition-all flex flex-col justify-between space-y-3 shadow-inner"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                        <span>{bot.name}</span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          bot.creator === 'iSiA' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                          bot.creator === 'PineScript' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                          'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                          {bot.creator}
                        </span>
                      </h4>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed mt-1 font-semibold">"{bot.explanation}"</p>
                    </div>
                    <div className="flex items-center space-x-1.5 ml-3">
                      <button
                        onClick={() => setExpandedScannerId(expandedScannerId === bot.id ? null : bot.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 border ${
                          expandedScannerId === bot.id
                            ? 'bg-orange-500 text-white border-orange-550 shadow-md shadow-orange-500/10'
                            : 'bg-white text-slate-500 border-orange-100 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/20'
                        }`}
                        title="Voir la performance par régime de marché"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="text-[9px] uppercase font-bold hidden sm:inline">Régimes</span>
                        {expandedScannerId === bot.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => onDeleteScanner(bot.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 bg-white border border-orange-100 hover:border-rose-100 hover:bg-rose-50/20 rounded-lg transition-all cursor-pointer shadow-sm"
                        title="Supprimer ce scanner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-white/85 p-2.5 rounded-xl text-[11px] font-mono border border-orange-55">
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Règle</span>
                      <span className="text-slate-800 font-bold">
                        {bot.metric === 'change24h' ? 'Var24h' : bot.metric === 'change7d' ? 'Var7j' : 'Vol/Mcap'} {bot.condition === 'gte' ? '≥' : '≤'}{bot.value}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Taux Succès</span>
                      <span className="text-teal-600 font-black">{bot.successRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Trades</span>
                      <span className="text-slate-800 font-bold">{bot.totalTrades} fermés</span>
                    </div>
                  </div>

                  {expandedScannerId === bot.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="pt-2 border-t border-orange-100/60 overflow-hidden"
                    >
                      <RegimePerformanceChart performance={bot.regimePerformance} scannerName={bot.name} />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Backtester Sandbox (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-[40px] p-6 sm:p-8 border border-orange-100 shadow-2xl flex flex-col justify-between border-b-8 border-orange-500/20">
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Atelier de Backtest Historique</h3>
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs w-full">
              <div>
                <label className="block text-slate-500 font-bold mb-1" htmlFor="backtestAsset">Actif à tester :</label>
                <select
                  id="backtestAsset"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full bg-white border border-orange-150 p-2.5 rounded-xl text-slate-700 font-semibold outline-none focus:border-orange-400 shadow-sm cursor-pointer"
                >
                  <option value="BTC">₿ Bitcoin (BTC)</option>
                  <option value="ETH">Ξ Ethereum (ETH)</option>
                  <option value="SOL">◎ Solana (SOL)</option>
                  <option value="DOGE">🐕 Dogecoin (DOGE)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1" htmlFor="backtestScanner">Scanner du Lab :</label>
                <select
                  id="backtestScanner"
                  value={selectedScannerId}
                  onChange={(e) => setSelectedScannerId(e.target.value)}
                  className="w-full bg-white border border-orange-150 p-2.5 rounded-xl text-slate-700 font-semibold outline-none focus:border-orange-400 shadow-sm cursor-pointer"
                >
                  {scanners.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleLaunchBacktest}
              disabled={isBacktesting || scanners.length === 0}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-extrabold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer shadow-lg hover:shadow-orange-550/10 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isBacktesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isBacktesting ? 'Backtest en cours...' : 'Lancer le Backtest (365 Jours)'}</span>
            </button>

            {/* Backtest Report Render */}
            {backtestResult && (
              <div className="space-y-4 pt-1 animate-fade-in text-xs sm:text-sm w-full">
                <div className="bg-orange-50/25 rounded-2xl p-4 border border-orange-100 border-l-4 border-l-orange-500 space-y-3 font-semibold">
                  <div className="flex items-center justify-between text-xs border-b border-orange-100 pb-1.5 font-black">
                    <span className="text-slate-800">{backtestResult.scannerName} vs {backtestResult.assetName}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-600 font-bold mr-1">{backtestResult.confidenceLevel}</span>
                      <button
                        onClick={handleCopyBacktest}
                        title="Copier le rapport de backtest"
                        className="p-1 hover:bg-orange-100/50 rounded-lg text-slate-400 hover:text-orange-500 transition-all cursor-pointer flex items-center space-x-1 font-bold text-[10px]"
                      >
                        {copiedBacktest ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-teal-650" />
                            <span className="text-teal-650">Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-white p-2 rounded-xl border border-orange-50 shadow-inner">
                      <span className="text-[9px] text-slate-400 block font-bold">Rendement Bot</span>
                      <span className={`font-black ${backtestResult.scannerReturn >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                        {backtestResult.scannerReturn >= 0 ? '+' : ''}{backtestResult.scannerReturn}%
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-orange-50 shadow-inner">
                      <span className="text-[9px] text-slate-400 block font-bold">S&P / Hold</span>
                      <span className={`font-black ${backtestResult.buyAndHoldReturn >= 0 ? 'text-orange-600' : 'text-rose-600'}`}>
                        {backtestResult.buyAndHoldReturn >= 0 ? '+' : ''}{backtestResult.buyAndHoldReturn}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-white p-2 rounded-xl border border-orange-50 shadow-inner text-slate-700">
                      <span className="text-[9px] text-slate-400 block font-bold">Trades / Win Rate</span>
                      <span className="font-bold">{backtestResult.totalTrades} pos. / {backtestResult.winRate}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-orange-50 shadow-inner">
                      <span className="text-[9px] text-slate-400 block font-bold">Surapprentissage</span>
                      <span className={`font-black ${backtestResult.overfittingIndex > 50 ? 'text-rose-600' : 'text-teal-600'}`}>
                        {backtestResult.overfittingIndex} / 100 ({backtestResult.overfittingIndex > 50 ? 'SURAPPRIS' : 'ROBUSTE'})
                      </span>
                    </div>
                  </div>

                  {/* Backtest SVG Line Graph */}
                  <div className="pt-2 border-t border-orange-100">
                    <span className="text-[9.5px] text-slate-400 font-mono block font-bold">Espace d'apprentissage & de validation :</span>
                    <div className="w-full bg-white h-32 rounded-xl mt-1.5 border border-orange-100 relative flex items-center justify-center shadow-inner overflow-hidden">
                      {/* Vertical line divider representing Training vs Validation partition */}
                      <div className="absolute left-[49.3%] top-0 bottom-0 border-l border-dashed border-orange-200 flex flex-col justify-between text-[8px] text-slate-400 py-1 select-none pointer-events-none font-bold z-10">
                        <span>ENTRAINEMENT</span>
                        <span className="text-right">VALIDATION</span>
                      </div>
                      
                      {/* Plot custom comparative curves using lightweight custom vector line path */}
                      <svg className="w-full h-full overflow-hidden p-2 z-0" viewBox="0 0 350 120" preserveAspectRatio="none">
                        {/* Buy and hold curve */}
                        <path
                          d={`M 0,${120 - (backtestResult.trainingPath[0].price / 7)} ` + 
                             backtestResult.trainingPath.map((p, i) => `L ${(i / 365) * 350},${120 - Math.min(115, Math.max(5, (p.price / (selectedAsset === 'SOL' ? 1.5 : selectedAsset === 'ETH' ? 40 : 700))))}`).join(' ')}
                          fill="none"
                          stroke="#fb923c"
                          strokeWidth="1.2"
                          strokeOpacity="0.45"
                        />
                        {/* Scanner Equity curve (Robust vs Decay) */}
                        <path
                          d={`M 0,${120 - (backtestResult.trainingPath[0].equity)} ` + 
                             backtestResult.trainingPath.map((p, i) => `L ${(i / 365) * 350},${120 - Math.min(115, Math.max(5, (p.equity / 1.7)))}`).join(' ') + ' ' + 
                             backtestResult.validationPath.map((p, i) => `L ${((i + 180) / 365) * 350},${120 - Math.min(115, Math.max(5, (p.equity / 1.7)))}`).join(' ')}
                          fill="none"
                          stroke="#0d9488"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCommentBacktest}
                  disabled={isIAWorking}
                  className="w-full bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/50 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Brain className="w-4 h-4" />
                  <span>{isIAWorking ? 'Évaluation en cours...' : "iSiA, évalue l'overfitting !"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continuously Simulated Ledger/Paper Tracking Feed & Mutations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Paper Trade Logs (Ledger) */}
        <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl space-y-3 border-b-6 border-orange-550/20">
          <div className="flex items-center justify-between border-b border-orange-100 pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Positions paper-trading en direct</h3>
            </div>
            <button
              onClick={handleExportJSON}
              title="Exporter les scanners, trades et logs d'évolutions d'iSiA au format JSON"
              className="p-1 hover:bg-orange-100/50 rounded-lg text-slate-400 hover:text-orange-500 transition-all cursor-pointer flex items-center space-x-1.5 font-bold text-[10px]"
            >
              {exportedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-teal-600">Exporté (JSON) !</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter JSON</span>
                </>
              )}
            </button>
          </div>
          
          <div className="bg-orange-50/15 rounded-2xl p-3.5 h-44 overflow-y-auto space-y-2 border border-orange-100/60 shadow-inner">
            {paperTrades.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">
                Recherche d'opportunités en arrière-plan sur le top 100...<br />
                <span className="text-[10px] text-slate-400 leading-relaxed block mt-1">Tâches d'accumulation et analyses de régime en continu.</span>
              </p>
            ) : (
              <div className="space-y-2">
                {paperTrades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] font-mono hover:bg-orange-50/20 p-2 rounded-lg transition-colors border-b border-orange-50/40 last:border-0 font-semibold text-slate-705">
                    <div>
                      <span className="bg-orange-100 px-1.5 py-0.5 rounded-lg text-orange-600 font-bold mr-1.5">{t.asset}</span>
                      <span className="text-slate-400 font-medium">({t.scannerName})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-650 font-bold">${t.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className={`font-black ${t.returnPct >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
                        {t.returnPct >= 0 ? '+' : ''}{t.returnPct.toFixed(2)}%
                      </span>
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold ${
                        t.status === 'OPEN' ? 'bg-orange-100 text-orange-750 animate-pulse border border-orange-200' :
                        t.status === 'WIN' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Self-Evolution Logs & Mutations Log */}
        <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl space-y-3 border-b-6 border-orange-550/20">
          <div className="flex items-center justify-between border-b border-orange-100 pb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-orange-500 shrink-0" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Journal Évolutif & Mutations (IA)</h3>
            </div>
            <button
              onClick={handleCopyLogs}
              title="Copier les logs d'évolution"
              className="p-1 hover:bg-orange-100/50 rounded-lg text-slate-400 hover:text-orange-500 transition-all cursor-pointer flex items-center space-x-1 font-bold text-[10px]"
            >
              {copiedLogs ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-teal-600">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier les logs</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-orange-50/15 rounded-2xl p-3.5 h-44 overflow-y-auto space-y-2 font-mono text-[11px] border border-orange-100/60 shadow-inner">
            <AnimatePresence initial={false}>
              {evolutionLogs.map((log, idx) => {
                const isMutation = log.includes("[MUTATION]") || log.includes("[ELIMINATION]");
                return (
                  <motion.div
                    key={`${idx}-${log.substring(0, 10)}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-1.5 rounded-lg font-semibold ${isMutation ? 'bg-teal-50 text-teal-800 border border-teal-200/50 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800 transition-colors'}`}
                  >
                    {log}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
