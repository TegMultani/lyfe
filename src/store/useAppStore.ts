import { create } from 'zustand';
import { fetchData, updateData } from '../lib/firebase';

export type FeedCategory = 'World' | 'Canada' | 'Tech' | 'Finance';
export type YoutubeRegion = 'CA' | 'US' | 'GB' | 'AU';

export interface StreamChannel {
    name: string;
    url: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    date: string;    // YYYY-MM-DD
    time: string;    // HH:mm
    color: string;   // hex or tailwind-compatible
}

export interface YoutubeVideo {
    videoId: string;
    title: string;
    channel: string;
    viewCount?: string;
    publishedAt?: string;
    thumbnail: string;
}

export interface Reminder {
    id: string;
    title: string;
    remindAt: string;
    done: boolean;
}

export interface UserConfig {
    widgets: string[];
    stocks: string[];
    newsCategory: FeedCategory;
    streams: StreamChannel[];
    activeStreamIndex: number;
    youtubeRegion: YoutubeRegion;
    youtubeKeyword: string;
    watchLater: YoutubeVideo[];
    events: CalendarEvent[];
    reminders: Reminder[];
    weatherCity: string;
}

type AppPhase = 'loading' | 'needs_pin' | 'ready';

interface AppState {
    phase: AppPhase;
    userCode: string | null;
    config: UserConfig | null;
    initApp: () => void;
    loginWithCode: (code: string) => Promise<boolean>;
    createNewCode: (code: string) => Promise<boolean>;
    logout: () => void;
    updateConfig: (newConfig: Partial<UserConfig>) => Promise<void>;
}

const DEFAULT_STREAMS: StreamChannel[] = [
    { name: 'CBC News Network', url: 'https://cbcrclinear-tor.akamaized.net/hls/live/2042769/geo_allow_ca/CBCRCLINEAR_TOR_15/master5.m3u8' },
    { name: 'BBC World', url: 'https://dash2.antik.sk/live/test_bbc_world/playlist.m3u8' },
];

const DEFAULT_CONFIG: UserConfig = {
    widgets: ['stocks', 'news', 'streams', 'youtube', 'calendar', 'socials', 'weather'],
    stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
    newsCategory: 'Tech',
    streams: DEFAULT_STREAMS,
    activeStreamIndex: 0,
    youtubeRegion: 'CA',
    youtubeKeyword: 'technology',
    watchLater: [],
    events: [],
    reminders: [],
    weatherCity: 'Toronto',
};

function migrateConfig(raw: any): UserConfig {
    const config = { ...DEFAULT_CONFIG, ...raw };

    if (config.streams?.length > 0 && typeof config.streams[0] === 'string') {
        const STREAM_NAMES: Record<string, string> = { cbcrclinear: 'CBC News Network', bbc_world: 'BBC World' };
        config.streams = (config.streams as string[]).map((url: string) => {
            const key = Object.keys(STREAM_NAMES).find(k => url.includes(k));
            return { name: key ? STREAM_NAMES[key] : 'Channel', url };
        });
    }

    if (typeof config.activeStreamIndex !== 'number') config.activeStreamIndex = 0;
    if (!config.youtubeRegion) config.youtubeRegion = 'CA';
    if (!config.youtubeKeyword) config.youtubeKeyword = 'technology';
    if (!config.watchLater) config.watchLater = [];
    if (!config.events) config.events = [];
    if (!config.reminders) config.reminders = [];
    if (!config.weatherCity) config.weatherCity = 'Toronto';
    if (!config.widgets?.includes('calendar')) config.widgets = [...(config.widgets || []), 'calendar'];
    if (!config.widgets?.includes('socials')) config.widgets = [...(config.widgets || []), 'socials'];
    if (!config.widgets?.includes('weather')) config.widgets = [...(config.widgets || []), 'weather'];

    return config;
}

function firebasePath(code: string) {
    return `users/pin-${code}`;
}

export const useAppStore = create<AppState>((set, get) => ({
    phase: 'loading',
    userCode: null,
    config: null,

    initApp: () => {
        const saved = localStorage.getItem('lyfe_pin');
        if (saved && /^\d{4}$/.test(saved)) {
            get().loginWithCode(saved);
        } else {
            set({ phase: 'needs_pin' });
        }
    },

    loginWithCode: async (code: string) => {
        if (!/^\d{4}$/.test(code)) return false;
        const remote = await fetchData(firebasePath(code));
        if (!remote) return false;
        const config = migrateConfig(remote);
        localStorage.setItem('lyfe_pin', code);
        set({ phase: 'ready', userCode: code, config });
        return true;
    },

    createNewCode: async (code: string) => {
        if (!/^\d{4}$/.test(code)) return false;
        const existing = await fetchData(firebasePath(code));
        if (existing) return false;
        await updateData(firebasePath(code), DEFAULT_CONFIG);
        localStorage.setItem('lyfe_pin', code);
        set({ phase: 'ready', userCode: code, config: DEFAULT_CONFIG });
        return true;
    },

    logout: () => {
        localStorage.removeItem('lyfe_pin');
        set({ phase: 'needs_pin', userCode: null, config: null });
    },

    updateConfig: async (updates: Partial<UserConfig>) => {
        const { userCode, config } = get();
        if (!userCode || !config) return;
        const newConfig = { ...config, ...updates };
        set({ config: newConfig });
        await updateData(firebasePath(userCode), newConfig);
    },
}));
