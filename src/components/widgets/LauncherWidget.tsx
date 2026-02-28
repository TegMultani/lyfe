'use client';
import { useAppStore } from '@/store/useAppStore';
import { Clock } from 'lucide-react';

export function LauncherWidget() {
    const { config } = useAppStore();
    const date = new Date();

    return (
        <div className="flex flex-col items-center justify-center p-6 h-full text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300">
                    <Clock className="w-8 h-8 text-white/80" />
                </div>

                <h3 className="text-2xl font-semibold tracking-tight">
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </h3>
                <p className="text-sm text-white/50 mt-1 uppercase tracking-widest font-medium">
                    {date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
            </div>
        </div>
    );
}
