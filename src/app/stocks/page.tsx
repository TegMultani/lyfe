'use client';

import { StocksWidget } from '@/components/widgets/StocksWidget';
import { Activity } from 'lucide-react';

export default function StocksPage() {
    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-blue-500/20 p-2.5 rounded-xl">
                        <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Market Overview</h1>
                        <p className="text-sm text-white/40 mt-0.5">Search, pin, and track your favorite tickers.</p>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-white/10 rounded-3xl min-h-[600px] overflow-hidden shadow-2xl">
                    <StocksWidget showSearch={true} />
                </div>
            </div>
        </div>
    );
}
