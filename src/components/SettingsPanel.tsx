import React, { useState } from 'react';
import { UserSettings } from '../types.ts';
import { Settings, Eye, EyeOff, Save, Bell, Info } from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export default function SettingsPanel({ settings, onUpdateSettings }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings });
  const [showKeys, setShowKeys] = useState({ fmp: false, finnhub: false, lunar: false, groq: false });
  const [statusMsg, setStatusMsg] = useState('');

  const handleToggleShow = (key: 'fmp' | 'finnhub' | 'lunar' | 'groq') => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setLocalSettings(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setStatusMsg('Réglages sauvegardés avec succès !');
    setTimeout(() => setStatusMsg(''), 3000);

    // Request speech system permissions if enabled
    if (localSettings.systemSpeech) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Réglages synchronisés. Je suis parée !");
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
      }
    }

    if (localSettings.intelligentAlerts) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification("iSiA v2 — Alertes Actives", {
              body: "Je te préviendrai dès qu'un breakout important aura lieu !",
            });
          }
        });
      }
    }
  };

  const affectionOptions = [
    { value: 'mon petit bouchon', label: 'Mon petit bouchon' },
    { value: 'ma cannette', label: 'Ma cannette' },
    { value: 'Desperado', label: 'Desperado' },
    { value: "l'As des breakouts", label: 'L\'As des breakouts' },
    { value: 'le loup de la Tech', label: 'Le loup de la Tech' },
    { value: 'Fred', label: 'Fred (Taquinerie active)' }
  ];

  return (
    <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-orange-100 shadow-2xl space-y-6 border-b-8 border-orange-500/20">
      <div className="flex items-center space-x-3 border-b border-orange-100 pb-4">
        <Settings className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-black text-slate-900 font-sans tracking-wide">Réglages d'iSiA v2</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personnalité & Profil */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-orange-605 uppercase tracking-widest">Compagnon & Identité</h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="nickname">
              Ton prénom ou pseudo
            </label>
            <input
              id="nickname"
              type="text"
              name="nickname"
              value={localSettings.nickname}
              onChange={handleChange}
              className="w-full bg-orange-50/15 text-slate-800 border border-orange-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="selectedAffection">
              Comment iSiA doit t'appeler
            </label>
            <select
              id="selectedAffection"
              name="selectedAffection"
              value={localSettings.selectedAffection}
              onChange={handleChange}
              className="w-full bg-orange-50/15 text-slate-850 border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors cursor-pointer"
            >
              {affectionOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-3">
            <div className="flex items-start space-x-3">
              <input
                id="coachMode"
                type="checkbox"
                name="coachMode"
                checked={localSettings.coachMode}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-200 bg-orange-50 rounded"
              />
              <div className="text-sm">
                <label htmlFor="coachMode" className="font-extrabold text-slate-800 cursor-pointer select-none">
                  Activer le Mode Coach Pédagogique
                </label>
                <p className="text-xs text-slate-500 font-semibold">
                  Ajoute des explications claires et vulgarisées sur les concepts techniques (RSI, MACD, volumes...) à chaque intervention.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                id="systemSpeech"
                type="checkbox"
                name="systemSpeech"
                checked={localSettings.systemSpeech}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-200 bg-orange-50 rounded"
              />
              <div className="text-sm">
                <label htmlFor="systemSpeech" className="font-extrabold text-slate-800 cursor-pointer select-none">
                  Synthèse Vocale PWA (Voix Haute)
                </label>
                <p className="text-xs text-slate-500 font-semibold">
                  Laisse iSiA lire tout haut ses réponses de chat et ses commentaires de marché avec son ton de compagne complice.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                id="intelligentAlerts"
                type="checkbox"
                name="intelligentAlerts"
                checked={localSettings.intelligentAlerts}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-orange-200 bg-orange-50 rounded"
              />
              <div className="text-sm">
                <label htmlFor="intelligentAlerts" className="font-extrabold text-slate-800 cursor-pointer select-none">
                  Alertes Systèmes Intelligentes
                </label>
                <p className="text-xs text-slate-500 font-semibold">
                  Reçois des notifications système (ou bannières directes) sur les nouveaux sommets, creux et activations de scanners du Lab.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-orange-605 uppercase tracking-widest">Clés d'API Personnelles</h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/50 px-2.5 py-1 rounded-full font-bold font-mono">
              Local Only
            </span>
          </div>

          <p className="text-xs text-slate-500 font-semibold">
            Configure tes clés API pour déverrouiller des données de marché en temps réel et des analyses avancées. Vos clés restent stockées de façon sécurisée en local.
          </p>

          {/* Financial Modeling Prep key */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="fmpKey">
              Financial Modeling Prep API Key (Screener Actions/ETF)
            </label>
            <div className="relative">
              <input
                id="fmpKey"
                type={showKeys.fmp ? 'text' : 'password'}
                name="fmpKey"
                value={localSettings.fmpKey}
                onChange={handleChange}
                placeholder="Introduire clé FMP..."
                className="w-full bg-orange-50/15 text-slate-800 border border-orange-100 rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors"
              />
              <button
                type="button"
                onClick={() => handleToggleShow('fmp')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500"
              >
                {showKeys.fmp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Finnhub key */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="finnhubKey">
              Finnhub API Key (Signaux techniques MACD/RSI)
            </label>
            <div className="relative">
              <input
                id="finnhubKey"
                type={showKeys.finnhub ? 'text' : 'password'}
                name="finnhubKey"
                value={localSettings.finnhubKey}
                onChange={handleChange}
                placeholder="Clé Finnhub..."
                className="w-full bg-orange-50/15 text-slate-800 border border-orange-100 rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors"
              />
              <button
                type="button"
                onClick={() => handleToggleShow('finnhub')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500"
              >
                {showKeys.finnhub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* LunarCrush key */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="lunarCrushKey">
              LunarCrush API Key (Galaxy Score Sentiment Social)
            </label>
            <div className="relative">
              <input
                id="lunarCrushKey"
                type={showKeys.lunar ? 'text' : 'password'}
                name="lunarCrushKey"
                value={localSettings.lunarCrushKey}
                onChange={handleChange}
                placeholder="Clé LunarCrush..."
                className="w-full bg-orange-50/15 text-slate-800 border border-orange-100 rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors"
              />
              <button
                type="button"
                onClick={() => handleToggleShow('lunar')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500"
              >
                {showKeys.lunar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Groq key */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5" htmlFor="groqKey">
              Clé d'API Groq (Optionnelle - Llama 3)
            </label>
            <div className="relative">
              <input
                id="groqKey"
                type={showKeys.groq ? 'text' : 'password'}
                name="groqKey"
                value={localSettings.groqKey}
                onChange={handleChange}
                placeholder="Clé Groq gsk_... (Laisser vide pour utiliser Gemini de base)"
                className="w-full bg-orange-50/15 text-slate-800 border border-orange-100 rounded-xl pl-3 pr-10 py-2.5 text-xs focus:outline-none focus:border-orange-400 font-semibold shadow-inner transition-colors"
              />
              <button
                type="button"
                onClick={() => handleToggleShow('groq')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500"
              >
                {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center gap-4 pt-4 border-t border-orange-100">
        <div className="flex items-center space-x-2 text-xs text-slate-500 mr-auto font-semibold">
          <Info className="w-4 h-4 text-orange-500 shrink-0" />
          <span>Aucune donnée n'est stockée sur serveur distant. Confidentialité assurée.</span>
        </div>
        
        {statusMsg && (
          <span className="text-sm text-teal-600 font-bold animate-fade-in">{statusMsg}</span>
        )}

        <button
          onClick={handleSave}
          className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-extrabold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer shadow-lg shadow-orange-550/15"
        >
          <Save className="w-4 h-4" />
          <span>Sauvegarder</span>
        </button>
      </div>
    </div>
  );
}
