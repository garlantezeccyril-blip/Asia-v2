import { useState, useEffect, useRef } from 'react';
import { UserSettings, Message, Scanner, PaperTrade } from './types.ts';
import { INITIAL_SCANNERS, OFFLINE_BOT_ANSWERS, JOKES, ANECDOTES } from './mockData.ts';
import ChatPanel from './components/ChatPanel.tsx';
import TradingHub from './components/TradingHub.tsx';
import PineAnalyzer from './components/PineAnalyzer.tsx';
import TheLab from './components/TheLab.tsx';
import SettingsPanel from './components/SettingsPanel.tsx';
import { Sparkles, MessageSquare, LineChart, FileCode, Cpu, Settings, Volume2, ShieldAlert, Bell, Bot } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  nickname: 'Cyril',
  selectedAffection: 'mon petit bouchon',
  coachMode: true,
  intelligentAlerts: true,
  systemSpeech: false,
  fmpKey: '',
  finnhubKey: '',
  lunarCrushKey: '',
  groqKey: ''
};

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'chat' | 'hub' | 'pine' | 'lab' | 'settings'>('chat');

  // Core Persisted States
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('isia_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const saved = localStorage.getItem('isia_chat');
    if (saved) return JSON.parse(saved);
    
    // Initial friendly greeting from iSiA
    return [{
      id: 'welcome',
      role: 'assistant',
      content: "Ah, mon petit bouchon ! Bienvenue sur iSiA v2, ta compagne de courtage co-évolutive ! 🚀\n\nIci, l'intensité est à son max ! Les marchés ne dorment jamais, Fred essaie encore de shorter les breakouts en levier 100x (le pauvre), et mes scanners du Lab tournent en continu pour chasser les pépites.\n\nDis-moi, tu veux qu'on analyse un script Pine, qu'on lance un backtest, ou simplement causer métaux précieux ? Je suis parée !",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }];
  });

  const [scanners, setScanners] = useState<Scanner[]>(() => {
    const saved = localStorage.getItem('isia_scanners');
    return saved ? JSON.parse(saved) : INITIAL_SCANNERS;
  });

  const [paperTrades, setPaperTrades] = useState<PaperTrade[]>(() => {
    const saved = localStorage.getItem('isia_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [terminalLogs, setTerminalLogs] = useState<string[]>(['[Systeme] Lab initialisé en arriere-plan...', '[Systeme] Recherche d\'accumulation sur le top 100...']);
  const [evolutionLogs, setEvolutionLogs] = useState<string[]>(['[Lab v2] Moteur auto-évolutif actif.']);

  // Dynamic state
  const [btcPrice, setBtcPrice] = useState(67340);
  const [isSending, setIsSending] = useState(false);

  // Sync state helpers
  useEffect(() => {
    localStorage.setItem('isia_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('isia_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('isia_scanners', JSON.stringify(scanners));
  }, [scanners]);

  useEffect(() => {
    localStorage.setItem('isia_trades', JSON.stringify(paperTrades));
  }, [paperTrades]);

  // Periodic Ticks - Simulates live background paper-trading, market regime detection, alert systems, and scanner mutations!
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Simuler fluctuation BTC
      const tickChange = (Math.random() - 0.49) * 120; // slight upward drift
      const nextBtc = Number((btcPrice + tickChange).toFixed(1));
      setBtcPrice(nextBtc);

      // Check breakout alert condition on BTC
      if (settings.intelligentAlerts) {
        if (Math.abs(tickChange) > 105) {
          triggerPwaNotification(
            "iSiA — Alerte Breakout Actif !",
            `Mouvement majeur détecté sur Bitcoin : $${nextBtc.toLocaleString()} !`
          );
          
          // Inject an automatic alert bubble directly into the chat history!
          const alertMsg: Message = {
            id: `alert_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ [ALERTE FLASH] Oh ${settings.selectedAffection}, regarde ça ! Le Bitcoin vient de déraper sec ou bondir en flèche à $${nextBtc.toLocaleString()} ! Fred est sûrement déjà liquidé, mais pour nous, c'est un signal de volatilité majeure !`,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };
          setChatHistory(prev => [...prev, alertMsg]);
        }
      }

      // 2. Simuler un paper-trade du Lab occasionnellement (environ 30% de chance d'activité à chaque tick)
      if (Math.random() > 0.70 && scanners.length > 0) {
        const activeScanners = scanners.filter(s => s.isActive);
        if (activeScanners.length > 0) {
          const randomScanner = activeScanners[Math.floor(Math.random() * activeScanners.length)];
          const coinSymbols = ['SOL', 'ETH', 'ADA', 'DOT', 'NEAR', 'LINK', 'DOGE', 'XRP'];
          const pickedCoin = coinSymbols[Math.floor(Math.random() * coinSymbols.length)];
          const entryOffset = Math.random() > 0.5 ? 1 : -1;
          const pctResult = (Math.random() - 0.4) * 5.0; // slight positive bias

          const newTrade: PaperTrade = {
            id: `trade_${Date.now()}`,
            scannerName: randomScanner.name,
            asset: pickedCoin,
            entryPrice: Number((btcPrice * (pickedCoin === 'ETH' ? 0.05 : 0.002)).toFixed(2)),
            currentPrice: Number((btcPrice * (pickedCoin === 'ETH' ? 0.051 : 0.0021)).toFixed(2)),
            returnPct: pctResult,
            status: pctResult > 0 ? 'WIN' : 'LOSS',
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          };

          // Append to paper history (limit to 30 records)
          setPaperTrades(prev => [newTrade, ...prev.slice(0, 29)]);

          // Update Bot performance parameters dynamically
          setScanners(current => current.map(s => {
            if (s.id === randomScanner.id) {
              const updatedTotals = s.totalTrades + 1;
              const winCount = s.totalTrades * (s.successRate / 100) + (pctResult > 0 ? 1 : 0);
              const updatedSuccess = (winCount / updatedTotals) * 100;
              return {
                ...s,
                totalTrades: updatedTotals,
                successRate: Number(updatedSuccess.toFixed(1))
              };
            }
            return s;
          }));

          const logMsg = `[Lab Engine] Scanner '${randomScanner.name}' positions fermées sur ${pickedCoin} avec ${pctResult >= 0 ? '+' : ''}${pctResult.toFixed(2)}%`;
          setTerminalLogs(prev => [logMsg, ...prev.slice(0, 15)]);

          // --- 3. Self-Evolution check ! ---
          // Mutate underperforming scanners (< 48.0% success rate after at least 15 trades)
          if (randomScanner.totalTrades > 10 && randomScanner.successRate < 48.0) {
            // Find a healthy survivor to clone/mutate from
            const survivors = scanners.filter(s => s.successRate >= 50.0);
            const parentBot = survivors.length > 0 ? survivors[0] : INITIAL_SCANNERS[0];
            const mutFactor = Number((parentBot.value * (1 + (Math.random() - 0.5) * 0.25)).toFixed(2));

            const mutationName = `${parentBot.name} Muté v${(Math.random() * 9).toFixed(1)}`;
            const mutatedBot: Scanner = {
              id: `mut_${Date.now()}`,
              name: mutationName,
              metric: parentBot.metric,
              condition: parentBot.condition,
              value: mutFactor,
              explanation: `Mutation auto-évolutive du Lab basée sur ${parentBot.name}, modifiant le seuil réactif à ${mutFactor}% d\'écart.`,
              successRate: 52.5,
              totalTrades: 3,
              isActive: true,
              creator: 'iSiA',
              regimePerformance: { ...parentBot.regimePerformance }
            };

            // Kill underperformer & inject mutated survivor
            setScanners(current => [mutatedBot, ...current.filter(s => s.id !== randomScanner.id)]);
            
            const mutationLog = `[ELIMINATION] '${randomScanner.name}' éliminé sous-performance (${randomScanner.successRate}%). [MUTATION] Déploiement de '${mutationName}' à partir de '${parentBot.name}' !`;
            setEvolutionLogs(prev => [mutationLog, ...prev.slice(0, 10)]);

            // Log chat alert from iSiA explaining the evolution
            const systemChatUpdate: Message = {
              id: `mutation_${Date.now()}`,
              role: 'assistant',
              content: `🧬 [LAB MUTATION] Ouch ! Notre robot de trading '${randomScanner.name}' s'est écrasé avec seulement ${randomScanner.successRate}% de réussite sur le paper-trading. Je l'ai éradiqué immédiatement ! \n\nPas de sentiments dans ce laboratoire, mes petits bouchons. Pour le remplacer, j'ai fait muter notre survivant performant '${parentBot.name}' pour accoucher de '${mutationName}' avec un seuil de détection optimisé à ${mutFactor}% ! Il tourne déjà en continu.`,
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            };
            setChatHistory(prev => [...prev, systemChatUpdate]);
            
            triggerPwaNotification(
              "🧬 Mutation du Lab iSiA",
              `L'algorithme '${randomScanner.name}' a été éradiqué pour sous-performance. Nouveau clone déployé.`
            );
          }
        }
      }
    }, 8500);

    return () => clearInterval(interval);
  }, [btcPrice, scanners, settings]);

  // Request standard Web Desktop notification
  const triggerPwaNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted' && settings.intelligentAlerts) {
      new Notification(title, { body });
    }
  };

  // Convert user speech reply audio to TTS out loud voice
  const speakAloud = (text: string) => {
    if ('speechSynthesis' in window && settings.systemSpeech) {
      window.speechSynthesis.cancel();
      // Remove symbols or emojis from reading
      const sanitizedText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
      const utterance = new SpeechSynthesisUtterance(sanitizedText.substring(0, 400)); // safe limit
      utterance.lang = 'fr-FR';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Sending chat questions to Gemini API server-side endpoint
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      const isiaSystemInstruction = `Tu es iSiA (version 2), une compagne du quotidien pour la famille combinée avec une experte en trading crypto intense et passionnée.
Voici tes consignes d'expression obligatoires:
1. Ne donne JAMAIS d'injonction d'achat ou de vente ferme. Tu dois formuler des observations factuelles et donner ton ressenti intense. Tu finis TOUJOURS par une phrase claire rappelant que ce ne sont pas des conseils financiers (ex: "Ce n'est pas un conseil financier, mes petits bouchons !").
2. Adopte un ton dynamique, familier, passionné (tu vois des breakouts partout, tu parles de RSI en panique, tu parles comme si tu n'avais pas dormi à cause de tes positions de trading).
3. Tu t'adresses de façon affectueuse à l'utilisateur en utilisant de façon variée ses surnoms : ${settings.selectedAffection} (pseudo de configuration si besoin : ${settings.nickname}).
4. Taquine régulièrement et amicalement Fred, un ami que tu aimes titiller de façon récurrente ("Fred qui essaie encore de shorter à contre-tendance !", "Dis-moi que tu n'as pas fait comme Fred !").
5. ${settings.coachMode ? "Le mode Coach est activé ! Ajoute de façon ludique et pédagogique des explications vulgarisées sur les métriques techniques concernées (le RSI, le MACD, les volumes ou la dominance des métaux) pour instruire toute la famille." : "Sois amusante et va droit au but."}
`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage],
          systemInstruction: isiaSystemInstruction
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        const assistantMessage: Message = {
          id: `isia_${Date.now()}`,
          role: 'assistant',
          content: data.text,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, assistantMessage]);
        speakAloud(data.text);
      } else {
        triggerOfflineFallback(userText);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      triggerOfflineFallback(userText);
    } finally {
      setIsSending(false);
    }
  };

  // Generate offline responses beautifully in fallback
  const triggerOfflineFallback = (userText: string) => {
    let reply = '';
    const cleanPrompt = userText.toLowerCase();

    if (cleanPrompt.includes('blague')) {
      reply = `Ah ! En voilà une bien bonne, ${settings.selectedAffection} ! \n\n${JOKES[Math.floor(Math.random() * JOKES.length)]}\n\nEspérons que ça n'inspire pas trop Fred ! Et rappelez-le vous : ce n'est pas un conseil financier, mes petits bouchons !`;
    } else if (cleanPrompt.includes('anecdote')) {
      reply = `Excellente demande historique ! Regarde ça, ${settings.selectedAffection} : \n\n${ANECDOTES[Math.floor(Math.random() * ANECDOTES.length)]}\n\nCe n'est pas un conseil financier, mes petits bouchons !`;
    } else if (cleanPrompt.includes('panique') || cleanPrompt.includes('stresse') || cleanPrompt.includes('calme')) {
      reply = `${settings.selectedAffection}, respire... \n\n"Pourquoi ne pas faire une pause d'écran ? Sors prendre l'air. Laisse mes scanners surveiller les bougies. Je retiens tout d'une session à l'autre."\n\nCe n'est pas un conseil en investissement !`;
    } else {
      reply = `${OFFLINE_BOT_ANSWERS[Math.floor(Math.random() * OFFLINE_BOT_ANSWERS.length)]}\n\n(En raison d'un chargement d'API ou de secrets hors-connexion, j'utilise mes circuits d'analyse locaux sécurisés. Tout fonctionne sans serveur tiers !).\n\nCe n'est pas un conseil financier, ${settings.nickname} !`;
    }

    const assistantMessage: Message = {
      id: `isia_offline_${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setChatHistory(prev => [...prev, assistantMessage]);
    speakAloud(reply);
  };

  // Generic direct commentary for any active tab content
  const handleCommentaryQuery = async (title: string, dataContext: any) => {
    setIsSending(true);
    setCurrentTab('chat'); // swap view to chat dynamically so they read it

    try {
      const isiaSystemInstruction = `Tu es iSiA (version 2), une compagne du quotidien et experte en trading intense.
Analyse les données fournies et commente-les avec ta personnalité obsessionnelle de trader passionné, de façon percutante et drôle.
Fais des vannes sur Fred, parle d'indicateurs RSI ou Fear & Greed si opportun.
Finis TOUJOURS par une phrase d'astérisque de disclaimer claire (ex: "Ce n'est pas un conseil d'investissement, mes petits bouchons !").
`;

      const response = await fetch('/api/market/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabName: title,
          dataContext,
          coachMode: settings.coachMode,
          systemInstruction: isiaSystemInstruction
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        const assistantMessage: Message = {
          id: `isia_com_${Date.now()}`,
          role: 'assistant',
          content: `📊 [RAPPORT DE MARCHÉ — ${title.toUpperCase()}]\n\n${data.text}`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatHistory(prev => [...prev, assistantMessage]);
        speakAloud(data.text);
      } else {
        triggerOfflineFallback(`commentaire de marché sur ${title}`);
      }
    } catch (err) {
      triggerOfflineFallback(`commentaire de marché sur ${title}`);
    } finally {
      setIsSending(false);
    }
  };

  // Deployment of parsed Pine bot
  const handleDeployPineBot = (newBot: { name: string; metric: 'change24h' | 'change7d' | 'volMcapRatio'; condition: 'gte' | 'lte'; value: number; explanation: string }) => {
    const scannerToAdd: Scanner = {
      id: `pine_${Date.now()}`,
      name: newBot.name,
      metric: newBot.metric,
      condition: newBot.condition,
      value: newBot.value,
      explanation: newBot.explanation,
      successRate: 54.0,
      totalTrades: 1,
      isActive: true,
      creator: 'PineScript',
      regimePerformance: { bull: 60, bear: 50, range: 50, highVol: 55, lowVol: 50 }
    };
    setScanners(prev => [scannerToAdd, ...prev]);
    setTerminalLogs(prev => [`[Pine Compiler] Déploiement réussi du scanner '${newBot.name}'`, ...prev]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF9F5] text-slate-800 font-sans antialiased overflow-x-hidden">
      {/* Top Navigation Frame Brand header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 select-none">
          <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-black tracking-tighter p-1.5 px-3 rounded-xl flex items-center justify-center font-mono text-sm leading-none shrink-0 cursor-pointer transition-all shadow-md shadow-orange-500/10 hover:opacity-95">
            iSiA v2
          </div>
          <p className="text-xs text-slate-500 font-sans tracking-wide hidden sm:block">
            PWA Co-Évolutive & Compagne Trading de la famille
          </p>
        </div>

        {/* Live BTC tracker on header */}
        <div className="flex items-center space-x-4">
          <div className="bg-orange-50 rounded-lg px-2.5 py-1 text-[11px] font-mono border border-orange-100 flex items-center space-x-2">
            <span className="text-orange-500 font-bold block">₿ BTC :</span>
            <span className="text-slate-700 font-bold">${btcPrice.toLocaleString()}</span>
          </div>

          <div className="flex items-center space-x-2">
            {settings.intelligentAlerts && (
              <div className="relative">
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Flex Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20 sm:pb-6">
        
        {/* Navigation Sidebar Drawer (Fixed Left on desktop, tabs on bottom for PWA mobile feeling) */}
        <nav className="lg:col-span-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible bg-white lg:bg-transparent rounded-2xl border border-orange-100 lg:border-none p-2 lg:p-0 shrink-0 gap-1 lg:gap-2 justify-between lg:justify-start shadow-sm lg:shadow-none">
          <button
            onClick={() => setCurrentTab('chat')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'chat'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:inline">Compagne iSiA</span>
          </button>

          <button
            onClick={() => setCurrentTab('hub')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'hub'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/50'
            }`}
          >
            <LineChart className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:inline">Marchés</span>
          </button>

          <button
            onClick={() => setCurrentTab('pine')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'pine'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/50'
            }`}
          >
            <FileCode className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:inline">Analyseur Pine</span>
          </button>

          <button
            onClick={() => setCurrentTab('lab')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'lab'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/50'
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:inline">Le Lab Scanners</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`w-full flex items-center lg:space-x-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/15'
                : 'text-slate-500 hover:text-slate-800 hover:bg-orange-50/50'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:inline">Réglages</span>
          </button>
        </nav>

        {/* Content Panel (A dynamic grid layout based on screen sizes) */}
        <div className="lg:col-span-10 w-full">
          {currentTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Chat column */}
              <div className="lg:col-span-8">
                <ChatPanel
                  messages={chatHistory}
                  settings={settings}
                  isSending={isSending}
                  onSendMessage={handleSendMessage}
                  onClearHistory={() => setChatHistory([{
                    id: 'welcome_reset',
                    role: 'assistant',
                    content: "Entendu, historique nettoyé de fond en comble ! C'est reparti sur de nouvelles bases pour de nouveaux breakouts !",
                    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  }])}
                  btcPrice={btcPrice}
                  topMovingCryptos={[
                    { symbol: 'SOL', change: 22.4 },
                    { symbol: 'DOGE', change: 12.45 },
                    { symbol: 'ETH', change: 6.4 },
                    { symbol: 'AVAX', change: 5.1 },
                    { symbol: 'XRP', change: -2.1 }
                  ]}
                />
              </div>

              {/* Dynamic Summary feed right widget on Desktop (Hidden on Mobile) */}
              <div className="hidden lg:col-span-4 space-y-6">
                {/* Active Bots Widget */}
                <div className="bg-white border border-pink-100 rounded-[28px] p-5 shadow-xl border-b-4 border-pink-500/15">
                  <div className="flex items-center space-x-2 border-b border-orange-50 pb-2 mb-3">
                    <Bot className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Activité du Lab en direct</span>
                  </div>

                  <div className="space-y-2.5 content-center">
                    {scanners.map((bot) => (
                      <div key={bot.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 truncate w-32 font-semibold">{bot.name}</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-pink-600 font-bold">{bot.successRate}%</span>
                          <span className="text-slate-400">({bot.totalTrades}t)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulated Ledger/Ticker ticks Logs Widget */}
                <div className="bg-white border border-orange-100 rounded-[28px] p-5 shadow-xl border-b-4 border-orange-500/15">
                  <div className="flex items-center space-x-2 border-b border-orange-50 pb-2 mb-3">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Algorithmes Tick Logger</span>
                  </div>

                  <div className="font-mono text-[10px] text-slate-600 space-y-2 max-h-48 overflow-y-auto">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="truncate select-none leading-normal">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'hub' && (
            <TradingHub
              settings={settings}
              btcPrice={btcPrice}
              onPostIAComment={handleCommentaryQuery}
              isIAWorking={isSending}
            />
          )}

          {currentTab === 'pine' && (
            <PineAnalyzer
              settings={settings}
              onDeployPineBot={handleDeployPineBot}
            />
          )}

          {currentTab === 'lab' && (
            <TheLab
              settings={settings}
              scanners={scanners}
              paperTrades={paperTrades}
              terminalLogs={terminalLogs}
              evolutionLogs={evolutionLogs}
              onAddScanner={(s) => setScanners(prev => [s, ...prev])}
              onDeleteScanner={(id) => setScanners(prev => prev.filter(s => s.id !== id))}
              onPostIAComment={handleCommentaryQuery}
              isIAWorking={isSending}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPanel
              settings={settings}
              onUpdateSettings={(newSet) => setSettings(newSet)}
            />
          )}
        </div>
      </main>

      {/* Floating navigation bar bottom ONLY on Mobile devices */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-orange-100 flex items-center justify-around py-2 px-1 z-40 shadow-xl">
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex flex-col items-center p-1.5 transition-colors cursor-pointer ${
            currentTab === 'chat' ? 'text-pink-500 font-bold' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span className="text-[9px] mt-0.5">iSiA</span>
        </button>

        <button
          onClick={() => setCurrentTab('hub')}
          className={`flex flex-col items-center p-1.5 transition-colors cursor-pointer ${
            currentTab === 'hub' ? 'text-pink-500 font-bold' : 'text-slate-500'
          }`}
        >
          <LineChart className="w-4.5 h-4.5" />
          <span className="text-[9px] mt-0.5">Marchés</span>
        </button>

        <button
          onClick={() => setCurrentTab('pine')}
          className={`flex flex-col items-center p-1.5 transition-colors cursor-pointer ${
            currentTab === 'pine' ? 'text-pink-500 font-bold' : 'text-slate-500'
          }`}
        >
          <FileCode className="w-4.5 h-4.5" />
          <span className="text-[9px] mt-0.5">Pine</span>
        </button>

        <button
          onClick={() => setCurrentTab('lab')}
          className={`flex flex-col items-center p-1.5 transition-colors cursor-pointer ${
            currentTab === 'lab' ? 'text-pink-500 font-bold' : 'text-slate-500'
          }`}
        >
          <Cpu className="w-4.5 h-4.5" />
          <span className="text-[9px] mt-0.5">Lab</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center p-1.5 transition-colors cursor-pointer ${
            currentTab === 'settings' ? 'text-pink-500 font-bold' : 'text-slate-500'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          <span className="text-[9px] mt-0.5">Réglages</span>
        </button>
      </footer>
    </div>
  );
}
