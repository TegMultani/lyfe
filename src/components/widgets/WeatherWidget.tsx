'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CloudSun, CloudMoon, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Gauge, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type HourlyPoint = {
    time: string;
    temperature: number;
    weatherCode: number;
    isDay: boolean;
};

type DailyPoint = {
    date: string;
    weatherCode: number;
    high: number;
    low: number;
};

type WeatherPayload = {
    city: string;
    country: string;
    admin?: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    weatherLabel: string;
    high: number;
    low: number;
    isDay: boolean;
    hourlyForecast: HourlyPoint[];
    dailyForecast: DailyPoint[];
};

const DEFAULT_CITY = 'Surrey, BC, Canada';

function weatherIcon(code: number, isDay: boolean) {
    if ([95, 96, 99].includes(code)) return CloudLightning;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
    return isDay ? CloudSun : CloudMoon;
}

function formatHourLabel(time: string) {
    return new Date(time).toLocaleTimeString([], { hour: 'numeric' });
}

function formatDayLabel(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: 'short' });
}

export function WeatherWidget() {
    const { config, updateConfig } = useAppStore();
    const [query, setQuery] = useState(config?.weatherCity || DEFAULT_CITY);
    const [weather, setWeather] = useState<WeatherPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const city = config?.weatherCity || DEFAULT_CITY;

    useEffect(() => {
        setQuery(city);
    }, [city]);

    useEffect(() => {
        let mounted = true;
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
                if (!res.ok) {
                    const payload = await res.json().catch(() => null);
                    throw new Error(payload?.error || 'Unable to fetch weather right now.');
                }
                const data = await res.json();
                if (mounted) setWeather(data);
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Unable to fetch weather right now.');
                    setWeather(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchWeather();
        return () => {
            mounted = false;
        };
    }, [city]);

    const Icon = useMemo(() => weatherIcon(weather?.weatherCode ?? 1, weather?.isDay ?? true), [weather?.weatherCode, weather?.isDay]);
    const theme = weather?.isDay ? 'day' : 'night';

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const nextCity = query.trim();
        if (!nextCity || nextCity === city) return;
        updateConfig({ weatherCity: nextCity });
    };

    return (
        <div
            className={cn(
                'relative flex h-full flex-col overflow-hidden p-4 transition-all duration-700',
                theme === 'day'
                    ? 'bg-gradient-to-br from-zinc-100 via-white to-zinc-200 text-zinc-900'
                    : 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white'
            )}
        >
            <div className={cn(
                'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl transition-all duration-700',
                theme === 'day' ? 'bg-zinc-500/20' : 'bg-white/10'
            )} />

            <div className="relative z-10 mb-3 flex items-center justify-between">
                <div>
                    <p className={cn('text-[10px] uppercase tracking-[0.25em]', theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>Weather</p>
                    <h3 className={cn('text-sm font-semibold tracking-tight', theme === 'day' ? 'text-zinc-800' : 'text-white/90')}>Atmosphere</h3>
                </div>
                <div className={cn('rounded-full border p-2 backdrop-blur-md', theme === 'day' ? 'border-zinc-300 bg-white/70' : 'border-white/20 bg-white/5')}>
                    <Icon className={cn('h-4 w-4 animate-[pulse_3s_ease-in-out_infinite]', theme === 'day' ? 'text-zinc-600' : 'text-zinc-200')} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 mb-4 flex items-center gap-2">
                <div className={cn('flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 transition-all', theme === 'day' ? 'border-zinc-300 bg-white/80' : 'border-white/15 bg-white/5')}>
                    <Search className={cn('h-3.5 w-3.5', theme === 'day' ? 'text-zinc-400' : 'text-white/40')} />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search city"
                        className={cn('w-full bg-transparent text-xs outline-none placeholder:text-xs', theme === 'day' ? 'text-zinc-800 placeholder:text-zinc-400' : 'text-white placeholder:text-white/35')}
                    />
                </div>
                <button
                    type="submit"
                    className={cn('rounded-xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-transform hover:-translate-y-0.5', theme === 'day' ? 'border-zinc-300 bg-zinc-900 text-white hover:bg-black' : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20')}
                >
                    Update
                </button>
            </form>

            {loading ? (
                <div className={cn('relative z-10 mt-2 flex flex-1 flex-col justify-between rounded-2xl border p-4 animate-pulse', theme === 'day' ? 'border-zinc-300 bg-white/70' : 'border-white/10 bg-white/5')}>
                    <div className="h-4 w-24 rounded bg-black/20" />
                    <div className="h-10 w-32 rounded bg-black/20" />
                    <div className="grid grid-cols-3 gap-2">
                        <div className="h-12 rounded bg-black/20" />
                        <div className="h-12 rounded bg-black/20" />
                        <div className="h-12 rounded bg-black/20" />
                    </div>
                </div>
            ) : error ? (
                <div className={cn('relative z-10 rounded-2xl border p-4 text-xs', theme === 'day' ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-400/30 bg-red-500/10 text-red-200')}>
                    {error}
                </div>
            ) : weather ? (
                <div className={cn('relative z-10 flex flex-1 flex-col rounded-2xl border p-4 transition-all duration-500', theme === 'day' ? 'border-zinc-300 bg-white/80 shadow-[0_25px_55px_rgba(10,10,10,0.08)]' : 'border-white/10 bg-white/[0.04] shadow-[0_25px_55px_rgba(0,0,0,0.35)]')}>
                    <div className="mb-4">
                        <p className={cn('text-[11px] uppercase tracking-[0.2em]', theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>
                            {weather.city}, {weather.admin ? `${weather.admin}, ` : ''}{weather.country}
                        </p>
                        <p className={cn('text-4xl font-semibold tracking-tight mt-1 animate-[fadeIn_600ms_ease-out]', theme === 'day' ? 'text-zinc-900' : 'text-white')}>
                            {Math.round(weather.temperature)}°
                        </p>
                        <p className={cn('text-xs mt-1', theme === 'day' ? 'text-zinc-600' : 'text-white/65')}>
                            {weather.weatherLabel} · Feels like {Math.round(weather.feelsLike)}°
                        </p>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-[10px]">
                        <div className={cn('rounded-xl border p-2.5 transition-transform duration-300 hover:-translate-y-0.5', theme === 'day' ? 'border-zinc-300 bg-zinc-50' : 'border-white/10 bg-white/[0.03]')}>
                            <Droplets className={cn('mb-1 h-3.5 w-3.5', theme === 'day' ? 'text-zinc-500' : 'text-white/60')} />
                            <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>Humidity</p>
                            <p className={cn('text-xs font-medium mt-0.5', theme === 'day' ? 'text-zinc-900' : 'text-white')}>{weather.humidity}%</p>
                        </div>
                        <div className={cn('rounded-xl border p-2.5 transition-transform duration-300 hover:-translate-y-0.5', theme === 'day' ? 'border-zinc-300 bg-zinc-50' : 'border-white/10 bg-white/[0.03]')}>
                            <Wind className={cn('mb-1 h-3.5 w-3.5', theme === 'day' ? 'text-zinc-500' : 'text-white/60')} />
                            <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>Wind</p>
                            <p className={cn('text-xs font-medium mt-0.5', theme === 'day' ? 'text-zinc-900' : 'text-white')}>{Math.round(weather.windSpeed)} km/h</p>
                        </div>
                        <div className={cn('rounded-xl border p-2.5 transition-transform duration-300 hover:-translate-y-0.5', theme === 'day' ? 'border-zinc-300 bg-zinc-50' : 'border-white/10 bg-white/[0.03]')}>
                            <Gauge className={cn('mb-1 h-3.5 w-3.5', theme === 'day' ? 'text-zinc-500' : 'text-white/60')} />
                            <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>Today</p>
                            <p className={cn('text-xs font-medium mt-0.5', theme === 'day' ? 'text-zinc-900' : 'text-white')}>{Math.round(weather.low)}° / {Math.round(weather.high)}°</p>
                        </div>
                    </div>

                    <div className="mb-3">
                        <p className={cn('mb-2 text-[10px] uppercase tracking-[0.2em]', theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>Next 12 hours</p>
                        <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
                            {weather.hourlyForecast.map((hour) => {
                                const HourIcon = weatherIcon(hour.weatherCode, hour.isDay);
                                return (
                                    <div key={hour.time} className={cn('min-w-14 rounded-xl border p-2 text-center text-[10px] transition-transform hover:-translate-y-0.5', theme === 'day' ? 'border-zinc-300 bg-zinc-50' : 'border-white/10 bg-white/[0.03]')}>
                                        <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>{formatHourLabel(hour.time)}</p>
                                        <HourIcon className={cn('mx-auto my-1 h-3.5 w-3.5', theme === 'day' ? 'text-zinc-600' : 'text-zinc-200')} />
                                        <p className={cn('font-medium', theme === 'day' ? 'text-zinc-900' : 'text-white')}>{Math.round(hour.temperature)}°</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className={cn('mb-2 text-[10px] uppercase tracking-[0.2em]', theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>5-day forecast</p>
                        <div className="grid grid-cols-5 gap-1.5 text-[10px]">
                            {weather.dailyForecast.map((day) => {
                                const DayIcon = weatherIcon(day.weatherCode, true);
                                return (
                                    <div key={day.date} className={cn('rounded-xl border p-2 text-center', theme === 'day' ? 'border-zinc-300 bg-zinc-50' : 'border-white/10 bg-white/[0.03]')}>
                                        <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>{formatDayLabel(day.date)}</p>
                                        <DayIcon className={cn('mx-auto my-1 h-3.5 w-3.5', theme === 'day' ? 'text-zinc-600' : 'text-zinc-200')} />
                                        <p className={cn('font-medium', theme === 'day' ? 'text-zinc-900' : 'text-white')}>{Math.round(day.high)}°</p>
                                        <p className={cn(theme === 'day' ? 'text-zinc-500' : 'text-white/45')}>{Math.round(day.low)}°</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0px);
                    }
                }
            `}</style>
        </div>
    );
}
