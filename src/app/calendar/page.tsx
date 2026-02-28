'use client';

import { useState } from 'react';
import { useAppStore, CalendarEvent } from '@/store/useAppStore';
import { Calendar, Plus, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function CalendarPage() {
    const { config, updateConfig } = useAppStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('12:00');
    const [newColor, setNewColor] = useState(EVENT_COLORS[0]);

    const events = config?.events || [];

    // Calendar math
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const getDayStr = (day: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const getEventsForDay = (day: number) =>
        events.filter(e => e.date === getDayStr(day));

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const addEvent = () => {
        if (!newTitle.trim() || !selectedDate || !config) return;
        const event: CalendarEvent = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            title: newTitle.trim(),
            date: selectedDate,
            time: newTime,
            color: newColor,
        };
        updateConfig({ events: [...events, event] });
        setNewTitle('');
        setNewTime('12:00');
        setShowForm(false);
    };

    const deleteEvent = (id: string) => {
        if (!config) return;
        updateConfig({ events: events.filter(e => e.id !== id) });
    };

    const selectedEvents = selectedDate
        ? events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))
        : [];

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-violet-500/20 p-2.5 rounded-xl">
                        <Calendar className="w-7 h-7 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Calendar</h1>
                        <p className="text-sm text-white/40 mt-0.5">Manage your events and schedule.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-2 bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-5">
                            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <ChevronLeft className="w-5 h-5 text-white/50" />
                            </button>
                            <h2 className="text-lg font-semibold text-white/90">{monthName}</h2>
                            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <ChevronRight className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center text-[10px] text-white/30 font-medium uppercase tracking-wider py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for offset */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayStr = getDayStr(day);
                                const isToday = dayStr === todayStr;
                                const isSelected = dayStr === selectedDate;
                                const dayEvents = getEventsForDay(day);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(dayStr)}
                                        className={cn(
                                            "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-all relative",
                                            isSelected
                                                ? "bg-violet-500/20 border border-violet-500/40 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                                                : isToday
                                                    ? "bg-white/10 text-white font-bold border border-white/20"
                                                    : "hover:bg-white/5 text-white/60 border border-transparent"
                                        )}
                                    >
                                        <span>{day}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {dayEvents.slice(0, 3).map(e => (
                                                    <div key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Event Sidebar */}
                    <div className="space-y-4">
                        {selectedDate && (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-white/70">
                                        {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h3>
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            showForm ? "bg-violet-500/20 text-violet-400" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                        )}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Add Event Form */}
                                {showForm && (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Event title..."
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/50 transition-colors"
                                            onKeyDown={e => e.key === 'Enter' && addEvent()}
                                        />
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={e => setNewTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
                                        />
                                        <div className="flex gap-2">
                                            {EVENT_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setNewColor(c)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full transition-all",
                                                        newColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : "opacity-50 hover:opacity-100"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={addEvent}
                                            disabled={!newTitle.trim()}
                                            className="w-full bg-violet-500 hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-sm py-2 rounded-xl transition-colors"
                                        >
                                            Add Event
                                        </button>
                                    </div>
                                )}

                                {/* Events list */}
                                <div className="space-y-2">
                                    {selectedEvents.length === 0 && !showForm ? (
                                        <p className="text-xs text-white/25 text-center py-8">No events on this day</p>
                                    ) : selectedEvents.map(event => (
                                        <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 group">
                                            <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white/80 truncate">{event.title}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3 text-white/25" />
                                                    <span className="text-[10px] text-white/35">{formatTime(event.time)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {!selectedDate && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="w-10 h-10 text-white/10 mb-3" />
                                <p className="text-sm text-white/30">Select a date to view or add events</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
