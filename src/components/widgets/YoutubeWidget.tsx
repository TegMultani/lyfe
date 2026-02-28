'use client';
import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Youtube, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function formatViews(count: string | null) {
    if (!count) return '';
    const n = parseInt(count);
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
    return `${n} views`;
}

export function YoutubeWidget({ id, isEditing }: { id?: string; isEditing?: boolean }) {
    const { config, updateConfig } = useAppStore();
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKeyword, setEditingKeyword] = useState(false);
    const [keywordDraft, setKeywordDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const keyword = config?.youtubeKeyword || 'technology';

    useEffect(() => {
        if (!keyword) return;
        let mounted = true;
        setLoading(true);
        fetch(`/api/youtube?type=search&q=${encodeURIComponent(keyword)}&maxResults=8`)
            .then(res => res.json())
            .then(data => { if (mounted && Array.isArray(data)) setVideos(data); })
            .catch(() => { })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [keyword]);

    const startEditing = () => {
        setKeywordDraft(keyword);
        setEditingKeyword(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const saveKeyword = () => {
        if (keywordDraft.trim()) {
            updateConfig({ youtubeKeyword: keywordDraft.trim() });
        }
        setEditingKeyword(false);
    };

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-red-500/20 p-1.5 rounded-lg">
                        <Youtube className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-white/90">YouTube</h3>

                    {/* Editable keyword */}
                    {editingKeyword ? (
                        <form onSubmit={e => { e.preventDefault(); saveKeyword(); }} className="flex items-center gap-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={keywordDraft}
                                onChange={e => setKeywordDraft(e.target.value)}
                                onBlur={saveKeyword}
                                className="bg-white/10 border border-red-500/30 rounded-md px-2 py-0.5 text-[11px] text-white outline-none w-28 focus:border-red-500/60 transition-colors"
                            />
                            <button type="submit" className="p-0.5 rounded hover:bg-white/10">
                                <Check className="w-3 h-3 text-emerald-400" />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={startEditing}
                            className="flex items-center gap-1 text-[10px] text-white/40 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md transition-colors group"
                        >
                            <span>{keyword}</span>
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
                <Link href="/youtube" className="text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider font-medium">
                    Full
                </Link>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                        ))
                    ) : videos.map((v, i) => (
                        <a
                            key={v.videoId || i}
                            href={`https://www.youtube.com/watch?v=${v.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col rounded-xl overflow-hidden hover:ring-1 hover:ring-red-500/30 transition-all"
                        >
                            <div className="aspect-video bg-zinc-900 overflow-hidden relative">
                                {v.thumbnail && (
                                    <img
                                        src={v.thumbnail}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                )}
                            </div>
                            <div className="p-2 bg-white/[0.02]">
                                <h4 className="text-[11px] font-medium text-white/80 line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                                    {v.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[9px] text-white/30">
                                    <span className="truncate">{v.channel}</span>
                                    {v.viewCount && <span className="shrink-0">{formatViews(v.viewCount)}</span>}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
