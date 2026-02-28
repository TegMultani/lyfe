'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Settings, LayoutGrid, Newspaper, Tv, LineChart, Youtube, LogOut, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const { phase, userCode, logout } = useAppStore();
    const pathname = usePathname();

    const links = [
        { href: '/', icon: LayoutGrid, label: 'Home' },
        { href: '/news', icon: Newspaper, label: 'News' },
        { href: '/stocks', icon: LineChart, label: 'Stocks' },
        { href: '/streams', icon: Tv, label: 'Streams' },
        { href: '/youtube', icon: Youtube, label: 'YouTube' },
        { href: '/calendar', icon: CalendarDays, label: 'Calendar' },
    ];

    return (
        <aside className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/10 bg-black/60 backdrop-blur-xl md:top-0 md:h-screen md:w-20 md:flex-col md:justify-start md:border-r md:border-t-0 py-2 md:py-6">
            {links.map(link => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "group flex flex-col items-center gap-1 rounded-xl p-2 transition-colors md:p-3",
                            link.href !== '/' && "md:mt-2",
                            isActive
                                ? "text-white bg-white/10"
                                : "text-white/50 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <link.icon className={cn(
                            "h-5 w-5 md:h-6 md:w-6 transition-all",
                            isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        )} />
                        <span className="text-[9px] font-medium md:hidden">{link.label}</span>
                    </Link>
                );
            })}

            <div className="flex-1" />

            {/* User code + logout (desktop only) */}
            {userCode && (
                <div className="hidden md:flex flex-col items-center gap-2 mb-2">
                    <div className="text-[10px] text-white/30 font-mono tracking-[0.3em]">{userCode}</div>
                    <button
                        onClick={logout}
                        className="group flex flex-col items-center gap-1 rounded-xl p-2 text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Switch code"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            )}

            {phase === 'loading' && (
                <div className="absolute top-2 right-2 md:bottom-4 md:top-auto">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                </div>
            )}
        </aside>
    );
}
