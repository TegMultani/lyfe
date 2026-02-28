'use client';

import { useAppStore, FeedCategory } from '@/store/useAppStore';
import { Newspaper, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NewsPage() {
    const { config, updateConfig } = useAppStore();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const categories: FeedCategory[] = ['World', 'Canada', 'Tech', 'Finance'];

    useEffect(() => {
        if (!config?.newsCategory) return;
        let mounted = true;
        setLoading(true);
        fetch(`/api/news?category=${config.newsCategory}`)
            .then(res => res.json())
            .then(data => { if (mounted) setNews(data); })
            .catch(() => { })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [config?.newsCategory]);

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-orange-500/20 p-2.5 rounded-xl">
                        <Newspaper className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">News Feed</h1>
                        <p className="text-sm text-white/40 mt-0.5">Latest stories curated for your dashboard.</p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => updateConfig({ newsCategory: cat })}
                            className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                config?.newsCategory === cat
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                    : "bg-white/5 text-white/50 hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* News Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {news.map((item, i) => (
                            <a
                                key={i}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all overflow-hidden group"
                            >
                                {item.image ? (
                                    <div className="h-40 w-full overflow-hidden bg-zinc-900">
                                        <img
                                            src={item.image}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-24 w-full bg-gradient-to-br from-orange-500/10 to-amber-500/5 flex items-center justify-center">
                                        <Newspaper className="w-8 h-8 text-orange-500/20" />
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col p-4">
                                    <h3 className="text-sm font-medium leading-snug text-white/80 group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                                        {item.title}
                                    </h3>
                                    {item.summary && (
                                        <p className="text-xs text-white/30 leading-relaxed line-clamp-3 mb-3">
                                            {item.summary}
                                        </p>
                                    )}
                                    <div className="mt-auto flex items-center justify-between text-[10px] text-white/30 uppercase tracking-wider">
                                        <span className="truncate mr-2">{item.source}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span>{timeAgo(item.publishedTime)}</span>
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-orange-400 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
