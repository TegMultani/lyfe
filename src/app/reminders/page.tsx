'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Bell, CheckCircle2, Circle, Clock3, Plus, Trash2 } from 'lucide-react';
import { useAppStore, Reminder } from '@/store/useAppStore';

function formatReminderTime(value: string) {
    if (!value) return 'No time set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function RemindersPage() {
    const { config, updateConfig } = useAppStore();
    const [title, setTitle] = useState('');
    const [remindAt, setRemindAt] = useState('');

    const reminders = useMemo(() => {
        return [...(config?.reminders || [])].sort((a, b) => a.remindAt.localeCompare(b.remindAt));
    }, [config?.reminders]);

    const addReminder = async (e: FormEvent) => {
        e.preventDefault();
        if (!config || !title.trim() || !remindAt) return;
        const newReminder: Reminder = {
            id: crypto.randomUUID(),
            title: title.trim(),
            remindAt,
            done: false,
        };
        await updateConfig({ reminders: [...(config.reminders || []), newReminder] });
        setTitle('');
        setRemindAt('');
    };

    const toggleReminder = async (id: string) => {
        if (!config) return;
        const updated = (config.reminders || []).map(reminder =>
            reminder.id === id ? { ...reminder, done: !reminder.done } : reminder
        );
        await updateConfig({ reminders: updated });
    };

    const deleteReminder = async (id: string) => {
        if (!config) return;
        await updateConfig({ reminders: (config.reminders || []).filter(reminder => reminder.id !== id) });
    };

    return (
        <div className="min-h-screen bg-black p-4 md:p-8 md:pl-28 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                    <div className="bg-cyan-500/20 p-2.5 rounded-xl">
                        <Bell className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white/90">Reminders</h1>
                        <p className="text-sm text-white/40 mt-0.5">Add quick reminders with date and time.</p>
                    </div>
                </div>

                <form
                    onSubmit={addReminder}
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4"
                >
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        type="text"
                        placeholder="What do you need to remember?"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <input
                        value={remindAt}
                        onChange={e => setRemindAt(e.target.value)}
                        type="datetime-local"
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors [color-scheme:dark]"
                    />
                    <button
                        type="submit"
                        disabled={!title.trim() || !remindAt}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Set
                    </button>
                </form>

                <div className="space-y-3">
                    {reminders.length === 0 ? (
                        <div className="text-center text-sm text-white/30 py-16 border border-dashed border-white/10 rounded-2xl">
                            No reminders yet.
                        </div>
                    ) : (
                        reminders.map(reminder => (
                            <div
                                key={reminder.id}
                                className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3"
                            >
                                <button
                                    onClick={() => toggleReminder(reminder.id)}
                                    className="text-white/60 hover:text-emerald-400 transition-colors"
                                    title={reminder.done ? 'Mark as active' : 'Mark as done'}
                                >
                                    {reminder.done ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${reminder.done ? 'text-white/35 line-through' : 'text-white/85'}`}>
                                        {reminder.title}
                                    </p>
                                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/40">
                                        <Clock3 className="w-3.5 h-3.5" />
                                        {formatReminderTime(reminder.remindAt)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteReminder(reminder.id)}
                                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Delete reminder"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
