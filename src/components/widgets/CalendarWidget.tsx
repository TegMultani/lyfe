'use client';
import { useAppStore, CalendarEvent } from '@/store/useAppStore';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function formatEventTime(date: string, time: string) {
    const d = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (diff < 0) return 'Past';
    if (minutes < 60) return `In ${minutes}m`;
    if (hours < 24) return `In ${hours}h`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days}d`;
}

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

export function CalendarWidget({ id, isEditing }: { id?: string; isEditing?: boolean }) {
    const { config } = useAppStore();
    const events = config?.events || [];

    // Sort by date+time and get upcoming events
    const now = new Date();
    const upcoming = events
        .filter(e => new Date(`${e.date}T${e.time}`) >= now)
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
        .slice(0, 5);

    const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="flex flex-col h-full p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="bg-violet-500/20 p-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-white/90">Calendar</h3>
                        <p className="text-[10px] text-white/30">{today}</p>
                    </div>
                </div>
                <Link href="/calendar" className="text-[10px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-wider font-medium">
                    Full
                </Link>
            </div>

            {/* Upcoming Events */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                {upcoming.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <Calendar className="w-8 h-8 text-white/10 mb-2" />
                        <p className="text-xs text-white/30">No upcoming events</p>
                        <Link href="/calendar" className="text-[10px] text-violet-400 hover:text-violet-300 mt-1 transition-colors">
                            Add an event →
                        </Link>
                    </div>
                ) : upcoming.map(event => (
                    <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group"
                    >
                        <div
                            className="w-1 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate">{event.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Clock className="w-3 h-3 text-white/25" />
                                <span className="text-[10px] text-white/35">{formatTime(event.time)}</span>
                                <span className="text-[10px] text-white/20">•</span>
                                <span className="text-[10px] text-white/35">
                                    {new Date(event.date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0",
                            formatEventTime(event.date, event.time) === 'Past'
                                ? "bg-white/5 text-white/20"
                                : "bg-violet-500/10 text-violet-400"
                        )}>
                            {formatEventTime(event.date, event.time)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
