'use client';
import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface StockChartModalProps {
    symbol: string;
    onClose: () => void;
}

export function StockChartModal({ symbol, onClose }: StockChartModalProps) {
    const [data, setData] = useState<{ c: number[]; h: number[]; l: number[]; o: number[]; t: number[] } | null>(null);
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/stocks?symbol=${symbol}&type=candle&range=${range}`).then(r => r.json()),
            fetch(`/api/stocks?symbol=${symbol}`).then(r => r.json()),
        ]).then(([candleData, quoteData]) => {
            setData(candleData.s === 'no_data' ? null : candleData);
            setQuote(quoteData);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [symbol, range]);

    const isUp = (quote?.d || 0) >= 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold tracking-tight">{symbol}</h2>
                        {quote && (
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold tabular-nums">${quote.c?.toFixed(2)}</span>
                                <span className={`text-sm font-medium flex items-center gap-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {quote.d ? Math.abs(quote.d).toFixed(2) : '--'} ({quote.dp ? Math.abs(quote.dp).toFixed(2) : '--'}%)
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-white/50" />
                    </button>
                </div>

                {/* Range Selector */}
                <div className="flex gap-1 px-5 pt-4">
                    {(['7d', '30d', '90d'] as const).map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'
                                }`}
                        >
                            {r === '7d' ? '1W' : r === '30d' ? '1M' : '3M'}
                        </button>
                    ))}
                </div>

                {/* Chart */}
                <div className="p-5 h-72">
                    {loading ? (
                        <div className="w-full h-full bg-white/5 rounded-2xl animate-pulse" />
                    ) : !data || !data.c ? (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                            No chart data available for {symbol}
                        </div>
                    ) : (
                        <ChartSVG data={data.c} timestamps={data.t} isUp={isUp} />
                    )}
                </div>

                {/* Stats */}
                {quote && (
                    <div className="grid grid-cols-4 gap-px bg-white/5 border-t border-white/5">
                        {[
                            { label: 'Open', value: quote.o?.toFixed(2) },
                            { label: 'High', value: quote.h?.toFixed(2) },
                            { label: 'Low', value: quote.l?.toFixed(2) },
                            { label: 'Prev Close', value: quote.pc?.toFixed(2) },
                        ].map(stat => (
                            <div key={stat.label} className="bg-zinc-950 p-3 text-center">
                                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{stat.label}</div>
                                <div className="text-sm font-semibold tabular-nums">${stat.value || '--'}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ChartSVG({ data, timestamps, isUp }: { data: number[]; timestamps: number[]; isUp: boolean }) {
    if (!data?.length) return null;

    const padding = 8;
    const w = 600;
    const h = 240;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => ({
        x: padding + (i / (data.length - 1)) * chartW,
        y: padding + chartH - ((v - min) / range) * chartH,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

    const color = isUp ? '#34d399' : '#fb7185';
    const gradientId = isUp ? 'grad-up' : 'grad-down';

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(pct => (
                <line
                    key={pct}
                    x1={padding}
                    y1={padding + chartH * pct}
                    x2={w - padding}
                    y2={padding + chartH * pct}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                />
            ))}
            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradientId})`} />
            {/* Line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Current price dot */}
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill={color} />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="8" fill={color} opacity="0.3" />
        </svg>
    );
}
