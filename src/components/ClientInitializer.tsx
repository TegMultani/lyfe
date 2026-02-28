'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function ClientInitializer({ children }: { children: React.ReactNode }) {
    const { phase, initApp } = useAppStore();

    useEffect(() => {
        initApp();
    }, [initApp]);

    if (phase === 'loading') {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 p-1 backdrop-blur-xl border border-white/20 relative shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                        <div className="absolute inset-2 rounded-xl bg-white/20 animate-pulse" />
                    </div>
                    <p className="text-sm text-white/50 font-medium tracking-wide">INITIALIZING LYFE</p>
                </div>
            </div>
        );
    }

    if (phase === 'needs_pin') {
        return <PinScreen />;
    }

    return <>{children}</>;
}

function PinScreen() {
    const { loginWithCode, createNewCode } = useAppStore();
    const [digits, setDigits] = useState(['', '', '', '']);
    const [mode, setMode] = useState<'login' | 'create'>('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, [mode]);

    const handleDigit = (index: number, value: string) => {
        if (!/^\d?$/.test(value)) return;
        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);
        setError('');

        // Auto-focus next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 4 entered
        if (value && index === 3 && newDigits.every(d => d)) {
            submit(newDigits.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setDigits(newDigits);
        }
    };

    const submit = async (code: string) => {
        setLoading(true);
        setError('');

        if (mode === 'login') {
            const success = await loginWithCode(code);
            if (!success) {
                setError('Code not found. Check your digits or create a new one.');
                setDigits(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } else {
            const success = await createNewCode(code);
            if (!success) {
                setError('Code already taken. Try a different one.');
                setDigits(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        }

        setLoading(false);
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black p-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl font-bold tracking-tight text-white">
                        LYFE
                    </div>
                    <p className="text-sm text-white/40">Your personal dashboard</p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                        onClick={() => { setMode('login'); setDigits(['', '', '', '']); setError(''); }}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login'
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        Enter Code
                    </button>
                    <button
                        onClick={() => { setMode('create'); setDigits(['', '', '', '']); setError(''); }}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'create'
                                ? 'bg-white/10 text-white shadow-lg'
                                : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        New Code
                    </button>
                </div>

                {/* Instructions */}
                <p className="text-sm text-white/50 text-center">
                    {mode === 'login'
                        ? 'Enter your 4-digit code to sync your dashboard'
                        : 'Choose a 4-digit code for your new dashboard'
                    }
                </p>

                {/* PIN Inputs */}
                <div className="flex gap-4">
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            onChange={e => handleDigit(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            disabled={loading}
                            className="w-16 h-20 bg-white/5 border-2 border-white/10 rounded-2xl text-center text-3xl font-bold text-white outline-none
                focus:border-blue-500/50 focus:bg-white/[0.07] focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]
                transition-all disabled:opacity-50 caret-transparent"
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-400 text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                        {error}
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        <span>{mode === 'login' ? 'Loading your dashboard...' : 'Creating your dashboard...'}</span>
                    </div>
                )}

                {/* Hint */}
                <p className="text-[11px] text-white/20 text-center mt-4">
                    Use the same code on all your devices to keep your dashboard in sync
                </p>
            </div>
        </div>
    );
}
