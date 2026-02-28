'use client';

import { useState } from 'react';
import { useAppStore, StreamChannel } from '@/store/useAppStore';
import { StreamsWidget } from '@/components/widgets/StreamsWidget';
import { Tv, Radio, Plus, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StreamsPage() {
    const { config, updateConfig } = useAppStore();
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    const addChannel = () => {
        if (!newName.trim() || !newUrl.trim() || !config) return;
        const newChannel: StreamChannel = { name: newName.trim(), url: newUrl.trim() };
        updateConfig({ streams: [...config.streams, newChannel] });
        setNewName('');
        setNewUrl('');
        setShowAdd(false);
    };

    const removeChannel = (idx: number) => {
        if (!config) return;
        const updated = config.streams.filter((_, i) => i !== idx);
        const newActiveIdx = config.activeStreamIndex >= updated.length
            ? Math.max(0, updated.length - 1)
            : config.activeStreamIndex;
        updateConfig({ streams: updated, activeStreamIndex: newActiveIdx });
    };

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-indigo-500/20 p-2.5 rounded-xl">
                        <Tv className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Live Streams</h1>
                        <p className="text-sm text-white/40 mt-0.5">Watch and manage your live feeds.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Player */}
                    <div className="lg:col-span-3">
                        <div className="bg-black border border-white/10 rounded-3xl aspect-video overflow-hidden shadow-2xl">
                            <StreamsWidget />
                        </div>
                    </div>

                    {/* Channel List */}
                    <div className="lg:col-span-1 space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-medium text-white/40 uppercase tracking-[0.15em] pl-1">Channels</h3>
                            <button
                                onClick={() => setShowAdd(!showAdd)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    showAdd ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                )}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Add Channel Form */}
                        {showAdd && (
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Channel name (e.g. CNN)"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <input
                                    type="text"
                                    placeholder="Stream URL (.m3u8)"
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 transition-colors"
                                />
                                <button
                                    onClick={addChannel}
                                    disabled={!newName.trim() || !newUrl.trim()}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-sm py-2 rounded-xl transition-colors"
                                >
                                    Add Channel
                                </button>
                            </div>
                        )}

                        {/* Channel buttons */}
                        <div className="flex flex-col gap-2">
                            {config?.streams.map((ch, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-2xl transition-all border group",
                                        config.activeStreamIndex === idx
                                            ? "bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                            : "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                                    )}
                                >
                                    <button
                                        onClick={() => updateConfig({ activeStreamIndex: idx })}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <div className={cn("p-2 rounded-xl", config.activeStreamIndex === idx ? "bg-indigo-500/20" : "bg-white/5")}>
                                            <Radio className={cn("w-4 h-4", config.activeStreamIndex === idx ? "text-indigo-400" : "text-white/40")} />
                                        </div>
                                        <div>
                                            <div className={cn("text-sm font-medium", config.activeStreamIndex === idx ? "text-indigo-300" : "text-white/70")}>
                                                {ch.name}
                                            </div>
                                            {config.activeStreamIndex === idx && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                    <span className="text-[9px] text-red-400 font-medium uppercase tracking-wider">Now Playing</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => removeChannel(idx)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                                        title="Remove channel"
                                    >
                                        <X className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
