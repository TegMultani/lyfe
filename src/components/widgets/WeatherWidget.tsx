'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning, Moon, Sun, Search, RefreshCw, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyForecast {
  time: string;
  weatherCode: number;
  summary: string;
  icon: string;
  tempMax: number;
  tempMin: number;
}

interface WeatherPayload {
  location: {
    name: string;
    admin1?: string;
    country: string;
  };
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    is_day: number;
    summary: string;
    icon: string;
    wind_speed_10m: number;
  };
  daily: DailyForecast[];
}

const CITY_SUGGESTIONS = ['Toronto', 'New York', 'Tokyo', 'Paris', 'London', 'Vancouver', 'San Francisco', 'Dubai'];

function WeatherGlyph({ type, isDay }: { type: string; isDay: boolean }) {
  const common = 'h-8 w-8 transition-transform duration-500 group-hover:scale-110';

  switch (type) {
    case 'clear':
      return isDay ? <Sun className={cn(common, 'text-white animate-[spin_16s_linear_infinite]')} /> : <Moon className={cn(common, 'text-white/95 animate-pulse')} />;
    case 'cloudy':
    case 'partly':
      return <Cloud className={cn(common, 'text-white/90')} />;
    case 'rain':
      return <CloudRain className={cn(common, 'text-white/90 animate-bounce')} />;
    case 'snow':
      return <CloudSnow className={cn(common, 'text-white/90')} />;
    case 'fog':
      return <CloudFog className={cn(common, 'text-white/80')} />;
    case 'storm':
      return <CloudLightning className={cn(common, 'text-white')} />;
    default:
      return <Cloud className={cn(common, 'text-white/90')} />;
  }
}

export function WeatherWidget() {
  const { config, updateConfig } = useAppStore();
  const city = config?.weatherCity || 'Toronto';

  const [query, setQuery] = useState(city);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (targetCity: string) => {
    if (!targetCity.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
      if (!res.ok) throw new Error('Could not fetch weather data.');
      const data = await res.json();
      setWeather(data);
      setQuery(data.location.name);
      await updateConfig({ weatherCity: data.location.name });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not fetch weather data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [updateConfig]);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  const isDay = weather?.current?.is_day === 1;

  const shellClasses = useMemo(
    () =>
      cn(
        'group relative flex h-full flex-col overflow-hidden p-4 transition-all duration-700',
        isDay
          ? 'bg-gradient-to-br from-zinc-200 via-zinc-100 to-white text-zinc-900'
          : 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white',
      ),
    [isDay],
  );

  return (
    <div className={shellClasses}>
      <div className={cn('pointer-events-none absolute inset-0 opacity-70', isDay ? 'bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.8),transparent_55%)]' : 'bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.2),transparent_45%)]')} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className={cn('text-xs uppercase tracking-[0.25em]', isDay ? 'text-zinc-500' : 'text-white/40')}>Weather</p>
          <p className={cn('text-sm', isDay ? 'text-zinc-600' : 'text-white/70')}>{weather ? `${weather.location.name}, ${weather.location.country}` : 'Choose your city'}</p>
        </div>
        <button
          onClick={() => fetchWeather(query)}
          className={cn('rounded-full border p-2 transition-all hover:scale-105', isDay ? 'border-zinc-300 bg-white/70 text-zinc-700' : 'border-white/20 bg-white/10 text-white/80')}
          aria-label="Refresh weather"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      <form
        className={cn('relative z-10 mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2', isDay ? 'border-zinc-300/80 bg-white/70' : 'border-white/15 bg-white/10')}
        onSubmit={e => {
          e.preventDefault();
          fetchWeather(query);
        }}
      >
        <Search className={cn('h-4 w-4', isDay ? 'text-zinc-500' : 'text-white/40')} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          list="city-suggestions"
          placeholder="Choose a city"
          className={cn('w-full bg-transparent text-sm outline-none', isDay ? 'placeholder:text-zinc-400' : 'placeholder:text-white/30')}
        />
        <datalist id="city-suggestions">
          {CITY_SUGGESTIONS.map(option => (
            <option value={option} key={option} />
          ))}
        </datalist>
      </form>

      {error && <p className={cn('relative z-10 mt-2 text-xs', isDay ? 'text-red-500' : 'text-red-300')}>{error}</p>}

      <div className="relative z-10 mt-5 flex items-end justify-between">
        <div>
          <p className="text-5xl font-semibold tracking-tight">{weather ? `${Math.round(weather.current.temperature_2m)}°` : '--°'}</p>
          <p className={cn('mt-1 text-sm', isDay ? 'text-zinc-600' : 'text-white/70')}>{weather?.current.summary || 'Loading conditions'}</p>
        </div>
        <WeatherGlyph type={weather?.current.icon || 'partly'} isDay={isDay} />
      </div>

      <div className={cn('relative z-10 mt-4 flex items-center justify-between rounded-2xl border px-3 py-2 text-xs', isDay ? 'border-zinc-300 bg-white/60 text-zinc-700' : 'border-white/15 bg-white/10 text-white/80')}>
        <span>Feels like {weather ? `${Math.round(weather.current.apparent_temperature)}°` : '--°'}</span>
        <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> {weather ? `${Math.round(weather.current.wind_speed_10m)} km/h` : '--'}</span>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-5 gap-2">
        {weather?.daily?.slice(0, 5).map((day, idx) => (
          <div key={day.time} className={cn('rounded-xl border p-2 text-center transition-all duration-300 hover:-translate-y-0.5', isDay ? 'border-zinc-300 bg-white/55' : 'border-white/15 bg-white/10')}>
            <p className={cn('text-[10px] uppercase tracking-wider', isDay ? 'text-zinc-500' : 'text-white/50')}>{idx === 0 ? 'Now' : new Date(day.time).toLocaleDateString(undefined, { weekday: 'short' })}</p>
            <div className="mt-1 flex justify-center">
              <WeatherGlyph type={day.icon} isDay={isDay} />
            </div>
            <p className="mt-1 text-xs font-medium">{Math.round(day.tempMax)}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}
