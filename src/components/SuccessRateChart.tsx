import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Scanner } from '../types.ts';
import { Target, TrendingUp } from 'lucide-react';

interface SuccessRateChartProps {
  scanners: Scanner[];
}

export default function SuccessRateChart({ scanners }: SuccessRateChartProps) {
  const currentAvg = useMemo(() => {
    return scanners.reduce((sum, s) => sum + s.successRate, 0) / (scanners.length || 1);
  }, [scanners]);

  const data = useMemo(() => {
    const result = [];
    const now = new Date();

    // Generate a pseudo-random hash base on current scanners' name and success rate
    // to provide smooth persistent walk that reacts live to changes
    const hashString = scanners.map((s) => `${s.id}-${s.successRate}`).join('|');
    let seed = 0;
    for (let i = 0; i < hashString.length; i++) {
      seed = (seed + hashString.charCodeAt(i)) % 1000;
    }

    const seededRandom = (step: number) => {
      const x = Math.sin(seed + step) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      let val = currentAvg;
      if (i > 0) {
        // Build a cyclical drift with small seeded noise converging to 0 near today (i = 0)
        const drift = seededRandom(i) * 5 - 2.5; // -2.5% to +2.5%
        const cycle = Math.sin(i * 0.4) * 3;     // cycloid variation
        const deviation = (drift + cycle) * (i / 30);
        val = Math.max(10, Math.min(100, currentAvg + deviation));
      }

      result.push({
        date: dateStr,
        rate: parseFloat(val.toFixed(1)),
      });
    }

    return result;
  }, [scanners, currentAvg]);

  // High & Low metrics for statistics display
  const stats = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, change: 0 };
    const rates = data.map((d) => d.rate);
    const min = Math.min(...rates).toFixed(1);
    const max = Math.max(...rates).toFixed(1);
    const initial = data[0].rate;
    const final = data[data.length - 1].rate;
    const change = (final - initial).toFixed(1);
    return { min, max, change };
  }, [data]);

  return (
    <div className="bg-white rounded-[32px] p-6 border border-orange-100 shadow-2xl flex flex-col justify-between border-b-6 border-orange-550/20">
      <div className="space-y-4">
        {/* Header section with badge */}
        <div className="flex items-center justify-between border-b border-orange-100 pb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              Évolution du Taux (30j)
            </h3>
          </div>
          <span className="text-[10px] bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded-lg border border-pink-100 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-pink-500" />
            <span>Progression</span>
          </span>
        </div>

        {/* Small fast stats dashboard */}
        <div className="grid grid-cols-3 gap-2 bg-orange-50/10 p-2 border border-orange-100/50 rounded-2xl text-[10px] font-bold text-slate-600">
          <div className="text-center border-r border-orange-100/45">
            <span className="text-[8px] text-slate-400 block uppercase font-mono">Bas 30j</span>
            <span className="text-rose-600 font-black font-mono">{stats.min}%</span>
          </div>
          <div className="text-center border-r border-orange-100/45">
            <span className="text-[8px] text-slate-400 block uppercase font-mono">Haut 30j</span>
            <span className="text-teal-600 font-black font-mono">{stats.max}%</span>
          </div>
          <div className="text-center">
            <span className="text-[8px] text-slate-400 block uppercase font-mono">Variation</span>
            <span className={`font-black font-mono ${parseFloat(stats.change) >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {parseFloat(stats.change) >= 0 ? '+' : ''}{stats.change}%
            </span>
          </div>
        </div>

        {/* Chart container */}
        <div className="h-44 w-full select-none" id="recharts-success-rate-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '1px solid #ffedd5',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 'bold',
                  color: '#1e293b',
                }}
                formatter={(value: any) => [`${value}%`, 'Taux de Succès']}
                labelStyle={{ color: '#f97316', fontWeight: 800 }}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="url(#colorRateGrad)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRate)"
              />
              {/* Fallback gradient definition directly to keep line aesthetic supreme */}
              <defs>
                <linearGradient id="colorRateGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
