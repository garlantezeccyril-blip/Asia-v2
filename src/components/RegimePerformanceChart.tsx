import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

interface RegimePerformance {
  bull: number;
  bear: number;
  range: number;
  highVol: number;
  lowVol: number;
}

interface RegimePerformanceChartProps {
  performance: RegimePerformance;
  scannerName: string;
}

export default function RegimePerformanceChart({ performance, scannerName }: RegimePerformanceChartProps) {
  const chartData = useMemo(() => {
    return [
      { name: 'Marché Haussier (Bull)', rate: performance.bull, color: '#0d9488', key: 'bull' },
      { name: 'Marché Baissier (Bear)', rate: performance.bear, color: '#f43f5e', key: 'bear' },
      { name: 'Range (Indécis)', rate: performance.range, color: '#64748b', key: 'range' },
      { name: 'Forte Volatilité (Panic)', rate: performance.highVol, color: '#ea580c', key: 'highVol' },
      { name: 'Faible Volatilité (Calme)', performance: performance.lowVol, rate: performance.lowVol, color: '#8b5cf6', key: 'lowVol' },
    ];
  }, [performance]);

  // Find best regime
  const bestRegime = useMemo(() => {
    const list = [
      { name: 'de Marché Haussier (Bull)', val: performance.bull, text: 'Idéal lorsque la tendance générale pousse les prix vers le haut. Ce scanner exploite parfaitement la vélocité acheteuse.' },
      { name: 'de Marché Baissier (Bear)', val: performance.bear, text: 'Excellente capacité de protection ou d\'analyse à contre-courant. Idéal pour repérer des opportunités de short ou des rebonds de capitulations.' },
      { name: 'de Zone de Range (Marché plat)', val: performance.range, text: 'Excelle dans les bandes de prix horizontales. Parfait pour de l\'arbitrage de bornes de prix et des oscillations de RSI.' },
      { name: 'de Forte Volatilité (Crisis)', val: performance.highVol, text: 'Très robuste lors des fortes secousses et des cassures de volumes agressives.' },
      { name: 'de Faible Volatilité (Calme)', val: performance.lowVol, text: 'Idéal pour le swing trading tranquille sur des phases d\'accumulation lentes avant breakout.' },
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0];
  }, [performance]);

  return (
    <div className="bg-orange-50/10 border border-orange-100/50 rounded-2xl p-4 font-sans space-y-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-orange-100 pb-2">
        <div className="flex items-center space-x-1.5">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Régimes de Marché Cibles
          </h5>
        </div>
        <span className="text-[10px] mt-1 sm:mt-0 font-extrabold text-pink-600 bg-pink-50 border border-pink-100/60 px-2 py-0.5 rounded-md">
          Performance Historique (Taux de Succès)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Diagnostic left panel */}
        <div className="md:col-span-5 space-y-2.5">
          <div className="bg-white/80 border border-teal-100 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-teal-700 font-bold text-[11px] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Environnement recommandé</span>
            </div>
            <div className="text-xs font-black text-slate-800 uppercase font-mono">
              {bestRegime.name}
            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-500 font-semibold mt-1">
              {bestRegime.text}
            </p>
          </div>

          <div className="bg-white/50 border border-orange-50/80 rounded-xl p-2.5 text-center flex items-center justify-around">
            <div className="text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-mono tracking-wider font-extrabold">Meilleur Taux</span>
              <span className="font-extrabold font-mono text-xs text-teal-600 mt-0.5 block">
                {bestRegime.val.toFixed(0)}%
              </span>
            </div>
            <div className="w-px h-6 bg-orange-100/80" />
            <div className="text-center">
              <span className="block text-[8px] text-slate-400 uppercase font-mono tracking-wider font-extrabold">Moyenne Globale</span>
              <span className="font-extrabold font-mono text-xs text-orange-600 mt-0.5 block">
                {((performance.bull + performance.bear + performance.range + performance.highVol + performance.lowVol) / 5).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recharts BarChart panel */}
        <div className="md:col-span-7 h-44 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #ffedd5',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                }}
                formatter={(value: any) => [`${value}%`, 'Succès']}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={12}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
