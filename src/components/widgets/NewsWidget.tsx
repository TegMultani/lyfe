'use client';
import { useEffect, useState, useRef } from 'react';
import { useAppStore, FeedCategory } from '@/store/useAppStore';
import { Newspaper, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export function NewsWidget({ id, isEditing }: { id?: string; isEditing?: boolean }) {
    const { config, updateConfig } = useAppStore();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!config?.newsCategory) return;
        let mounted = true;
        const fetchNews = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/news?category=${config.newsCategory}`);
                if (res.ok) {
                    const data = await res.json();
                    if (mounted) setNews(data);
                }
            } catch (e) {
                console.error('Failed to fetch news', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchNews();
        return () => { mounted = false; };
    }, [config?.newsCategory]);

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.offsetWidth * 0.8;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    const categories: FeedCategory[] = ['World', 'Canada', 'Tech', 'Finance'];

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-orange-500/20 p-1.5 rounded-lg">
                        <Newspaper className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-white/90">{config?.newsCategory} News</h3>
                </div>
                <Link href="/news" className="text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider font-medium">
                    Full
                </Link>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1.5 mb-3 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => updateConfig({ newsCategory: cat })}
                        className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-medium uppercase tracking-wider transition-colors",
                            config?.newsCategory === cat
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-white/5 text-white/40 hover:bg-white/10 border border-transparent"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Carousel */}
            <div className="relative flex-1 min-h-0">
                {/* Scroll buttons - desktop only */}
                <button onClick={() => scroll('left')} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/80 transition-colors shadow-lg">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => scroll('right')} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-black/80 transition-colors shadow-lg">
                    <ChevronRight className="w-4 h-4" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto h-full snap-x snap-mandatory scroll-smooth pr-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="shrink-0 w-56 h-full snap-start rounded-2xl bg-white/5 animate-pulse" />
                        ))
                    ) : news.map((item, i) => (
                        <a
                            key={i}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 w-56 h-full snap-start rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all flex flex-col overflow-hidden group/card"
                        >
                            {/* Image */}
                            {item.image ? (
                                <div className="h-28 w-full overflow-hidden bg-zinc-900 shrink-0">
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            ) : (
                                <div className="h-16 w-full bg-gradient-to-br from-orange-500/10 to-amber-500/5 shrink-0 flex items-center justify-center">
                                    <Newspaper className="w-6 h-6 text-orange-500/30" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 flex flex-col p-3 min-h-0">
                                <h4 className="text-xs font-medium leading-snug text-white/80 group-hover/card:text-orange-400 transition-colors line-clamp-3 mb-1.5">
                                    {item.title}
                                </h4>
                                {item.summary && (
                                    <p className="text-[10px] leading-relaxed text-white/30 line-clamp-3 mb-auto">
                                        {item.summary}
                                    </p>
                                )}
                                <div className="flex items-center justify-between mt-2 text-[9px] text-white/30 uppercase tracking-wider">
                                    <span className="truncate mr-2">{item.source}</span>
                                    <span className="shrink-0">{timeAgo(item.publishedTime)}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
