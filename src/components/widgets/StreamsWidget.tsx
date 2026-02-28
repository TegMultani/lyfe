'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore, StreamChannel } from '@/store/useAppStore';
import { Tv, PlayCircle, Radio, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function StreamsWidget({ id, isEditing }: { id?: string; isEditing?: boolean }) {
    const { config, updateConfig } = useAppStore();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hlsRef = useRef<Hls | null>(null);

    const activeIdx = config?.activeStreamIndex ?? 0;
    const activeStream = config?.streams?.[activeIdx];

    const playStream = (url: string) => {
        const video = videoRef.current;
        if (!video) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (Hls.isSupported()) {
            const hls = new Hls({ capLevelToPlayerSize: true });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(() => { });
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            video.play().catch(() => { });
        }
    };

    useEffect(() => {
        if (playing && activeStream) {
            playStream(activeStream.url);
        }
        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [playing, activeIdx]);

    // Update muted state and volume on video element
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = muted;
            videoRef.current.volume = volume;
        }
    }, [muted, volume]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    const toggleFullscreen = useCallback(() => {
        const video = videoRef.current;
        const container = containerRef.current;

        if (isFullscreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            }
            return;
        }

        // iOS Safari: fullscreen on the video element directly
        if (video && (video as any).webkitEnterFullscreen) {
            (video as any).webkitEnterFullscreen();
            return;
        }

        // Standard Fullscreen API on the container
        if (container) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if ((container as any).webkitRequestFullscreen) {
                (container as any).webkitRequestFullscreen();
            }
        }
    }, [isFullscreen]);

    const selectChannel = (idx: number) => {
        updateConfig({ activeStreamIndex: idx });
    };

    return (
        <div ref={containerRef} className={cn("flex flex-col h-full relative overflow-hidden", isFullscreen && "bg-black")}>
            {/* Video / Poster */}
            <div className="flex-1 relative bg-black min-h-0">
                {!playing ? (
                    <div
                        className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 to-black flex flex-col items-center justify-center cursor-pointer group/play"
                        onClick={() => setPlaying(true)}
                    >
                        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl group-hover/play:scale-110 group-hover/play:bg-white/20 transition-all mb-2">
                            <PlayCircle className="w-7 h-7 text-white ml-0.5" />
                        </div>
                        <p className="text-[10px] text-white/50 font-medium uppercase tracking-[0.2em]">
                            {activeStream?.name || 'Live Feed'}
                        </p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            controls={false}
                            muted={muted}
                            playsInline
                        />
                        {/* Overlay Controls */}
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 backdrop-blur-md border border-white/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[9px] font-bold tracking-wider text-white">LIVE</span>
                        </div>

                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
                            {/* Volume Control */}
                            <div className="group flex items-center bg-black/50 backdrop-blur-md rounded-md hover:bg-black/70 transition-colors border border-white/10 overflow-hidden">
                                <button
                                    onClick={() => setMuted(!muted)}
                                    className="p-1.5 transition-colors"
                                    title={muted || volume === 0 ? 'Unmute' : 'Mute'}
                                >
                                    {muted || volume === 0 ? (
                                        <VolumeX className="w-3.5 h-3.5 text-white/70" />
                                    ) : (
                                        <Volume2 className="w-3.5 h-3.5 text-white/70" />
                                    )}
                                </button>
                                <div className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 group-hover:pr-2 transition-all duration-200 ease-out flex items-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={muted ? 0 : volume}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value);
                                            setVolume(v);
                                            if (v > 0) setMuted(false);
                                            else if (v === 0) setMuted(true);
                                        }}
                                        className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>
                            </div>

                            {/* Fullscreen toggle */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-1.5 rounded-md bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10"
                                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-3.5 h-3.5 text-white/70" />
                                ) : (
                                    <Maximize className="w-3.5 h-3.5 text-white/70" />
                                )}
                            </button>

                            {/* Streams page link */}
                            {!isFullscreen && (
                                <Link href="/streams" className="p-1.5 rounded-md bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10">
                                    <Tv className="w-3.5 h-3.5 text-white/70" />
                                </Link>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Channel Picker */}
            <div className={cn(
                "bg-zinc-950 border-t border-white/5 p-2 flex gap-1.5 overflow-x-auto",
                isFullscreen && "absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md z-20"
            )} style={{ scrollbarWidth: 'none' }}>
                {config?.streams.map((ch, idx) => (
                    <button
                        key={idx}
                        onClick={() => selectChannel(idx)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
                            idx === activeIdx
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                                : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/70"
                        )}
                    >
                        <Radio className="w-3 h-3" />
                        {ch.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
