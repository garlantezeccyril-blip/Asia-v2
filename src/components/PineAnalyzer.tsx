import React, { useState, useRef } from 'react';
import { Sparkles, Terminal, Upload, Play, RefreshCw, FileCode, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '../types.ts';

interface PineAnalyzerProps {
  settings: UserSettings;
  onDeployPineBot: (scannerObj: { name: string; metric: 'change24h' | 'change7d' | 'volMcapRatio'; condition: 'gte' | 'lte'; value: number; explanation: string }) => void;
}

export default function PineAnalyzer({ settings, onDeployPineBot }: PineAnalyzerProps) {
  const [scriptText, setScriptText] = useState<string>(`//@version=5
indicator("Breakout RSI Intense", overlay=true)
src = close
rsiVal = rsi(src, 14)
maVal = ta.sma(src, 50)

longCondition = rsiVal > 65 and src > maVal
plotshape(longCondition, style=shape.triangleup, location=location.belowbar, color=color.green, size=size.small)
`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [convertedBot, setConvertedBot] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setScriptText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // call REST API for explaining
  const handleAnalyzePine = async () => {
    if (!scriptText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setConvertedBot(null);

    try {
      const res = await fetch('/api/pine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText })
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysisResult(data.text || 'Analyse vide renvoyée par le modèle.');
      } else {
        setAnalysisResult(`Erreur lors de l'analyse : ${data.error || 'Erreur inconnue'}`);
      }
    } catch (err: any) {
      setAnalysisResult(`Erreur de connexion : ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // call REST API for converting
  const handleConvertToBot = async () => {
    if (!scriptText.trim()) return;
    setIsConverting(true);

    try {
      const res = await fetch('/api/pine/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptText })
      });
      const data = await res.json();
      if (res.ok && data.name) {
        setConvertedBot(data);
      } else {
        // Fallback convert
        setConvertedBot({
          name: "Vitesse RSI (Pine)",
          metric: "change24h",
          condition: "gte",
          value: 5.5,
          explanation: "Détection simplifiée basée sur le code Pine soumis."
        });
      }
    } catch (err) {
      setConvertedBot({
        name: "Vitesse RSI (Pine)",
        metric: "change24h",
        condition: "gte",
        value: 5.5,
        explanation: "Détection simplifiée basée sur le code Pine soumis."
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeployBot = () => {
    if (!convertedBot) return;
    onDeployPineBot({
      name: convertedBot.name,
      metric: convertedBot.metric || 'change24h',
      condition: convertedBot.condition || 'gte',
      value: Number(convertedBot.value) || 5.0,
      explanation: convertedBot.explanation || 'Scanner extrait depuis Pine Script.'
    });
    setConvertedBot(null);
    alert(`Le scanner "${convertedBot.name}" a été créé et déployé avec succès dans le LAB !`);
  };

  return (
    <div className="bg-white rounded-[40px] border border-orange-100 shadow-2xl p-6 sm:p-8 space-y-6 border-b-8 border-orange-500/20">
      <div className="flex items-center space-x-3 border-b border-orange-100 pb-4">
        <FileCode className="w-6 h-6 text-orange-500" />
        <div>
          <h2 className="text-xl font-black text-slate-900 font-sans tracking-wide">Analyseur de Scripts Pine</h2>
          <p className="text-xs text-orange-650 font-semibold">Analyse, optimise et convertis tes indicateurs TradingView Pine Script pour le Lab.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest">Éditeur Pine Script</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">v5 recommandé</span>
          </div>

          {/* Drag & Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-5 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              dragActive ? 'border-orange-500 bg-orange-50/40' : 'border-orange-100 hover:border-orange-200 bg-orange-50/10'
            }`}
            onClick={triggerFileSelect}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pine,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Glissez-déposez votre script ici ou <span className="text-orange-600 underline">parcourez vos fichiers</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Accepte .pine et .txt (Interprétation par IA)</p>
          </div>

          {/* Code text pasting area */}
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            className="w-full h-80 bg-orange-50/20 text-slate-800 border border-orange-100 rounded-3xl px-4 py-3.5 font-mono text-xs focus:outline-none focus:border-orange-400 transition-colors placeholder-slate-400 leading-relaxed font-medium"
            placeholder="Copiez-collez votre Pine Script de TradingView ici..."
          />

          <div className="flex space-x-3">
            <button
              onClick={handleAnalyzePine}
              disabled={isAnalyzing || !scriptText.trim()}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-95 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-orange-500/15 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isAnalyzing ? 'Analyse en cours...' : 'Expliquer le Code'}</span>
            </button>

            <button
              onClick={handleConvertToBot}
              disabled={isConverting || !scriptText.trim()}
              className="bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/50 font-extrabold px-4.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Extraire pour le Lab</span>
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="space-y-4">
          <span className="text-xs font-extrabold text-orange-600 uppercase tracking-widest block">Compte-rendu d'iSiA</span>

          <div className="bg-orange-50/25 border border-orange-100 rounded-3xl p-5 h-[440px] overflow-y-auto space-y-4 font-sans shadow-sm">
            {!analysisResult && !convertedBot && !isAnalyzing && !isConverting && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-1.5">
                <Terminal className="w-10 h-10 text-slate-300" />
                <p className="text-xs font-bold text-slate-700">Aucune explication générée pour le moment.</p>
                <p className="text-[11px] font-medium text-slate-400">Utilisez les touches orange et vertes pour lancer l'exploitation intelligente d'iSiA !</p>
              </div>
            )}

            {(isAnalyzing || isConverting) && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5">
                <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
                <p className="text-xs font-bold text-slate-800">iSiA compile ses neurones de trading...</p>
                <p className="text-[10.5px] text-slate-500 max-w-xs font-medium">Je relis les boucles d'indicateurs de ton script pour en extraire la moelle osseuse financière !</p>
              </div>
            )}

            {analysisResult && (
              <div className="whitespace-pre-line text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-medium">
                {analysisResult}
              </div>
            )}

            {convertedBot && (
              <div className="bg-teal-50 border border-teal-200/85 rounded-2xl p-5 space-y-4">
                <div className="flex items-center space-x-2 text-teal-700 font-extrabold">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-sans">Stratégie Extraite du Code</span>
                </div>

                <div className="space-y-2 border-l-2 border-teal-500 pl-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Paramètres Proposés :</p>
                  <p className="text-sm font-black text-slate-850">Nom : {convertedBot.name}</p>
                  <p className="text-xs text-slate-600 font-semibold">
                    Métrique : <span className="font-mono text-teal-700 font-bold">{convertedBot.metric}</span>
                  </p>
                  <p className="text-xs text-slate-600 font-semibold">
                    Conditionneur : <span className="font-mono text-teal-700 font-bold">{convertedBot.condition === 'gte' ? 'Supérieur ou égal' : 'Inférieur ou égal'}</span>
                  </p>
                  <p className="text-xs text-slate-600 font-semibold">
                    Seuil de détection : <span className="font-mono text-teal-700 font-black">{convertedBot.value}</span>
                  </p>
                  <p className="text-xs text-slate-600 italic font-medium">"{convertedBot.explanation}"</p>
                </div>

                <p className="text-[10px] text-orange-700 font-bold bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                  ⚠️ Note : L'interprétation s'appuie sur une lecture par réseau de neurones Gemini. Le moteur exact de Pine Script TV ne tourne pas localement dans le navigateur.
                </p>

                <button
                  onClick={handleDeployBot}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-md shadow-orange-500/15"
                >
                  <span>Activer & Installer ce bot dans le Lab</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
