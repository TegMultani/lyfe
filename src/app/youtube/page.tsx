'use client';

import { useEffect, useState } from 'react';
import { useAppStore, YoutubeRegion } from '@/store/useAppStore';
import { Youtube, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const REGIONS: { code: YoutubeRegion; label: string }[] = [
    { code: 'CA', label: 'Canada' },
    { code: 'US', label: 'United States' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'AU', label: 'Australia' },
];

function formatViews(count: string | null) {
    if (!count) return '';
    const n = parseInt(count);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
    return `${n} views`;
}

function timeAgo(dateStr: string) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function YoutubePage() {
    const { config, updateConfig } = useAppStore();

    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const region = config?.youtubeRegion || 'CA';

    // Fetch popular or search results
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        const url = activeSearch
            ? `/api/youtube?type=search&q=${encodeURIComponent(activeSearch)}&region=${region}&maxResults=20`
            : `/api/youtube?type=popular&region=${region}&maxResults=20`;

        fetch(url)
            .then(res => res.json())
            .then(data => { if (mounted && Array.isArray(data)) setVideos(data); })
            .catch(() => { })
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [region, activeSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchQuery);
    };

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-red-500/20 p-2.5 rounded-xl">
                        <Youtube className="w-7 h-7 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">YouTube</h1>
                        <p className="text-sm text-white/40 mt-0.5">
                            {activeSearch ? `Search: "${activeSearch}"` : 'Trending videos'}
                        </p>
                    </div>
                </div>

                {/* Search + Regions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search YouTube..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-colors"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setActiveSearch(''); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex gap-2">
                        {REGIONS.map(r => (
                            <button
                                key={r.code}
                                onClick={() => updateConfig({ youtubeRegion: r.code })}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                    region === r.code
                                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                        : "bg-white/5 text-white/50 hover:bg-white/10"
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Keyword for dashboard widget */}
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <span className="text-xs text-white/40">Dashboard keyword:</span>
                    <input
                        type="text"
                        value={config?.youtubeKeyword || ''}
                        onChange={e => updateConfig({ youtubeKeyword: e.target.value })}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/30 transition-colors"
                        placeholder="e.g. technology, music, gaming..."
                    />
                </div>

                {/* Video Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="rounded-2xl overflow-hidden">
                                <div className="aspect-video bg-white/5 animate-pulse" />
                                <div className="h-16 bg-white/[0.02] animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {videos.map((v, i) => (
                            <a
                                key={v.videoId || i}
                                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all"
                            >
                                <div className="aspect-video bg-zinc-900 overflow-hidden relative">
                                    {v.thumbnail && (
                                        <img
                                            src={v.thumbnail}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-medium text-white/80 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                                        {v.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                                        <span className="truncate">{v.channel}</span>
                                        <span className="shrink-0">•</span>
                                        {v.viewCount && <span className="shrink-0">{formatViews(v.viewCount)}</span>}
                                        {v.publishedAt && <span className="shrink-0">• {timeAgo(v.publishedAt)}</span>}
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
