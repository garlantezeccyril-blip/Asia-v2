import React, { useState, useRef, useEffect } from 'react';
import { Message, UserSettings } from '../types.ts';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, HelpCircle, Flame } from 'lucide-react';
import { JOKES, ANECDOTES, CALMS } from '../mockData.ts';

interface ChatPanelProps {
  messages: Message[];
  settings: UserSettings;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  btcPrice: number;
  topMovingCryptos: { symbol: string; change: number }[];
}

export default function ChatPanel({
  messages,
  settings,
  isSending,
  onSendMessage,
  onClearHistory,
  btcPrice,
  topMovingCryptos
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // HTML5 Speech Recognition
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const SpeechVal = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechVal) {
      const rec = new SpeechVal();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };

      rec.onerror = (e: any) => {
        console.error('Speech Recognition Error', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleVoiceRecord = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur ou cet appareil. Essaye d'ouvrir l'appli dans un nouvel onglet !");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Shortcut Chips handlers
  const handleChipClick = (type: 'joke' | 'anecdote' | 'calm' | 'btc' | 'top5' | 'help') => {
    let prompt = '';
    switch (type) {
      case 'joke':
        prompt = "Raconte-moi une blague croustillante sur Fred ou le trading ! Tu dois le taquiner absolument.";
        break;
      case 'anecdote':
        prompt = "Donne-moi une anecdote historique croustillante sur les marchés financiers ou le Bitcoin.";
        break;
      case 'calm':
        prompt = "Je stresse face aux écrans, fais-moi une pause respiration ou donne-moi ton conseil de calme avec ton style d'amie cool.";
        break;
      case 'btc':
        prompt = `Commente le cours actuel du Bitcoin qui est à $${btcPrice}. Vois-tu un breakout imminent ? Donne ton ressenti intense !`;
        break;
      case 'top5':
        const topText = topMovingCryptos.map(c => `${c.symbol} (${c.change >= 0 ? '+' : ''}${c.change.toFixed(1)}%)`).join(', ');
        prompt = `Analyse et commente le top des cryptomonnaies qui bougent aujourd'hui : ${topText}. Vois-tu une accumulation ou un piège à ours ? Impose ton intensité de trader !`;
        break;
      case 'help':
        prompt = "Guide-moi sur ce que je peux faire avec tes outils : Screener Actions, Crypto, Cours Métaux précieux, Analyseur de scripts Pine et le Lab de scanners.";
        break;
    }
    onSendMessage(prompt);
  };

  return (
    <div className="bg-white rounded-[40px] border border-orange-100 shadow-2xl flex flex-col h-[650px] overflow-hidden border-b-8 border-orange-500/20">
      {/* Header */}
      <div className="bg-orange-50/50 px-5 py-4 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold font-sans flex items-center justify-center shadow-md shadow-orange-500/20">
              iS
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 rounded-full border-2 border-white animate-pulse"></span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 pb-0.5">iSiA v2</h2>
            <p className="text-[10px] text-orange-600 flex items-center font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1 animate-ping"></span>
              En ligne — Surnom : {settings.selectedAffection}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {settings.systemSpeech ? (
            <Volume2 className="w-4 h-4 text-orange-500" title="Audio activé" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-400" title="Audio muet" />
          )}
          <button
            onClick={onClearHistory}
            className="text-[10px] bg-pink-105 hover:bg-pink-200 text-pink-700 border border-pink-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Warnings & Notices */}
      <div className="bg-orange-50/30 px-5 py-2.5 border-b border-orange-50 flex items-start space-x-2">
        <AlertCircle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
        <span className="text-[10px] text-orange-800 font-sans font-semibold">
          Attention : iSiA n'émet aucun conseil d'investissement ferme. Pas d'injonction d'achat/vente. Vous tradez à vos propres risques, mes petits bouchons.
        </span>
      </div>

      {/* Message Logger */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-[24px] px-4.5 py-3 text-sm shadow-md transition-all ${
                  isUser
                    ? 'bg-[#fb923c] text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-orange-100 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-sans">iSiA v2</span>
                    {msg.content.includes("Mode Coach à la barre") && (
                      <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded-md font-mono font-bold">COACH</span>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-line leading-relaxed font-sans prose prose-slate max-w-none text-xs sm:text-sm font-medium">
                  {msg.content}
                </div>
                <div className={`text-[9px] mt-2 text-right ${isUser ? 'text-orange-100' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-500 border border-orange-100 rounded-[24px] rounded-bl-none px-4.5 py-3 text-sm shadow-sm">
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-sans">iSiA v2</span>
                <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200 px-1 rounded font-mono font-bold">En train de commenter...</span>
              </div>
              <div className="flex items-center space-x-1 py-1">
                <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Shortcut Chips Panel */}
      <div className="bg-orange-50/20 px-3 py-2 border-t border-orange-100 overflow-x-auto flex items-center space-x-2 shrink-0 scrollbar-none">
        <button
          onClick={() => handleChipClick('joke')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Blague</span>
        </button>
        <button
          onClick={() => handleChipClick('anecdote')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 text-pink-500" />
          <span>Anecdote</span>
        </button>
        <button
          onClick={() => handleChipClick('calm')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <span>🧘 Du Calme</span>
        </button>
        <button
          onClick={() => handleChipClick('btc')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <span className="text-orange-500 font-bold font-sans">₿</span>
          <span>BTC Direct</span>
        </button>
        <button
          onClick={() => handleChipClick('top5')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <span className="text-pink-500 font-bold">↑↑</span>
          <span>Pumping Top 5</span>
        </button>
        <button
          onClick={() => handleChipClick('help')}
          className="shrink-0 bg-white hover:bg-orange-50 text-slate-700 border border-orange-100 hover:border-orange-200 text-xs px-2.5 py-1 rounded-full transition-all flex items-center space-x-1 cursor-pointer font-medium shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5 text-pink-400" />
          <span>Aide</span>
        </button>
      </div>

      {/* Input panel */}
      <div className="bg-[#FFF9F5]/80 backdrop-blur-md px-4 py-3 border-t border-orange-50 flex items-center space-x-2 shrink-0">
        <button
          onClick={handleToggleVoiceRecord}
          className={`p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
            isRecording
              ? 'bg-pink-500 text-white animate-pulse shadow-lg'
              : 'bg-white text-slate-500 hover:text-slate-800 border border-orange-100 shadow-sm'
          }`}
          title={isRecording ? 'Arrêter l\'enregistrement' : 'Parler à iSiA'}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isRecording ? "Je vous écoute..." : "Écris un message ou demande une logique à iSiA..."}
          disabled={isRecording}
          className="flex-1 bg-white text-slate-800 border border-orange-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors placeholder-slate-400 shadow-inner"
        />

        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isSending}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-bold p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-lg shadow-orange-500/15 disabled:bg-slate-200 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
