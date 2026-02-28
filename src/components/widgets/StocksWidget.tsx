'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Activity, Search, Pin, PinOff, X, BarChart3, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { StockChartModal } from '@/components/StockChartModal';
import { createPortal } from 'react-dom';

function Sparkline({ data, isUp }: { data: number[]; isUp: boolean }) {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const h = 32;
    const w = 80;
    const points = data
        .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
        .join(' ');

    return (
        <svg width={w} height={h} className="shrink-0">
            <polyline
                fill="none"
                stroke={isUp ? '#34d399' : '#fb7185'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

interface StockRow {
    symbol: string;
    quote: any;
    candle: number[];
}

export function StocksWidget({ showSearch = false }: { showSearch?: boolean; id?: string; isEditing?: boolean }) {
    const { config, updateConfig } = useAppStore();
    const [rows, setRows] = useState<StockRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(showSearch);
    const [chartSymbol, setChartSymbol] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

    // Drag state
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);
    const touchStartY = useRef(0);
    const touchStartIdx = useRef(0);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    const fetchAll = async (tickers: string[]) => {
        setLoading(true);
        const results: StockRow[] = [];
        for (const symbol of tickers) {
            try {
                const [quoteRes, candleRes] = await Promise.all([
                    fetch(`/api/stocks?symbol=${symbol}`),
                    fetch(`/api/stocks?symbol=${symbol}&type=candle`),
                ]);
                const quote = quoteRes.ok ? await quoteRes.json() : {};
                const candle = candleRes.ok ? await candleRes.json() : {};
                results.push({ symbol, quote, candle: candle.c || [] });
            } catch {
                results.push({ symbol, quote: {}, candle: [] });
            }
        }
        setRows(results);
        setLoading(false);
    };

    useEffect(() => {
        if (config?.stocks?.length) fetchAll(config.stocks);
    }, [config?.stocks]);

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        clearTimeout(searchTimeout.current);
        if (!q.trim()) { setSearchResults([]); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/stocks?symbol=${q}&type=search`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults((data.result || []).slice(0, 6));
                }
            } catch { }
            setSearching(false);
        }, 400);
    };

    const togglePin = (symbol: string) => {
        if (!config) return;
        const isPinned = config.stocks.includes(symbol);
        const newStocks = isPinned ? config.stocks.filter(s => s !== symbol) : [...config.stocks, symbol];
        updateConfig({ stocks: newStocks });
    };

    // --- Drag-to-reorder ---
    const commitReorder = useCallback((fromIdx: number, toIdx: number) => {
        if (!config || fromIdx === toIdx) return;
        const arr = [...config.stocks];
        const [item] = arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, item);
        updateConfig({ stocks: arr });
    }, [config, updateConfig]);

    // HTML5 drag (desktop)
    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        // Make the drag image semi-transparent
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
        if (dragIdx !== null && overIdx !== null) {
            commitReorder(dragIdx, overIdx);
        }
        setDragIdx(null);
        setOverIdx(null);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    };

    // Touch drag (mobile)
    const handleTouchStart = (e: React.TouchEvent, idx: number) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartIdx.current = idx;
        setDragIdx(idx);
    };

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (dragIdx === null || !listRef.current) return;
        const y = e.touches[0].clientY;
        const listRect = listRef.current.getBoundingClientRect();
        const children = listRef.current.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            const childRect = child.getBoundingClientRect();
            const mid = childRect.top + childRect.height / 2;
            if (y < mid) {
                setOverIdx(i);
                return;
            }
        }
        setOverIdx(children.length - 1);
    }, [dragIdx]);

    const handleTouchEnd = () => {
        if (dragIdx !== null && overIdx !== null) {
            commitReorder(dragIdx, overIdx);
        }
        setDragIdx(null);
        setOverIdx(null);
    };

    return (
        <div className="flex flex-col h-full p-4 relative overflow-hidden">
            {/* Chart Modal */}
            {chartSymbol && mounted && createPortal(
                <StockChartModal symbol={chartSymbol} onClose={() => setChartSymbol(null)} />,
                document.body
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-sm text-white/90">Markets</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            searchOpen ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                        )}
                    >
                        <Search className="w-3.5 h-3.5" />
                    </button>
                    <Link href="/stocks" className="text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider font-medium">
                        Full
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <div className="mb-3 relative">
                    <input
                        type="text"
                        placeholder="Search ticker (e.g. TSLA)..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-colors"
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            {searchResults.map((r: any) => {
                                const isPinned = config?.stocks.includes(r.symbol);
                                return (
                                    <button
                                        key={r.symbol}
                                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                                        onClick={() => { togglePin(r.symbol); setSearchQuery(''); setSearchResults([]); }}
                                    >
                                        <div>
                                            <span className="text-sm font-medium text-white">{r.symbol}</span>
                                            <span className="text-xs text-white/40 ml-2 truncate">{r.description}</span>
                                        </div>
                                        {isPinned ? <PinOff className="w-3.5 h-3.5 text-rose-400 shrink-0" /> : <Pin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Ticker List */}
            <div ref={listRef} className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-5 h-5 animate-spin text-white/20" />
                    </div>
                ) : rows.map(({ symbol, quote, candle }, idx) => {
                    const isUp = (quote.d || 0) >= 0;
                    const isDragging = dragIdx === idx;
                    const isOver = overIdx === idx && dragIdx !== idx;

                    return (
                        <div
                            key={symbol}
                            draggable
                            onDragStart={e => handleDragStart(e, idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={e => handleDragOver(e, idx)}
                            onTouchStart={e => handleTouchStart(e, idx)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all border group/row cursor-pointer select-none",
                                isDragging ? "opacity-50 border-blue-500/30 scale-95" : "border-white/5",
                                isOver && "border-blue-500/50 bg-blue-500/5"
                            )}
                            onClick={() => { if (dragIdx === null) setChartSymbol(symbol); }}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Drag Handle */}
                                <div className="touch-none shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded text-white/15 hover:text-white/40 transition-colors">
                                    <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-sm tracking-wide">{symbol}</span>
                                        <BarChart3 className="w-3 h-3 text-white/20 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                                    </div>
                                    <div className={cn("text-[10px] flex items-center font-medium", isUp ? "text-emerald-400" : "text-rose-400")}>
                                        {isUp ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                                        {quote.d ? Math.abs(quote.d).toFixed(2) : '--'} ({quote.dp ? Math.abs(quote.dp).toFixed(2) : '--'}%)
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Sparkline data={candle} isUp={isUp} />
                                <div className="text-right">
                                    <div className="text-sm font-semibold tabular-nums">${quote.c?.toFixed(2) || '---'}</div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePin(symbol); }}
                                    className="opacity-0 group-hover/row:opacity-100 p-1 rounded-md hover:bg-red-500/20 transition-all"
                                    title="Unpin"
                                >
                                    <PinOff className="w-3 h-3 text-rose-400" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
