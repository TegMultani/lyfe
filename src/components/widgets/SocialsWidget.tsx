'use client';

import { cn } from '@/lib/utils';

const SOCIALS = [
    {
        name: 'Instagram',
        url: 'https://www.instagram.com',
        color: 'from-purple-600 via-pink-500 to-orange-400',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="6" r="1.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        name: 'Snapchat',
        url: 'https://www.snapchat.com',
        color: 'from-yellow-400 to-yellow-500',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M12 2C9.24 2 7.3 3.3 6.5 5.5c-.4 1-.3 2.7-.2 3.8-.6.2-1.3.5-1.3 1 0 .4.5.7 1.1.9-.2 1.5-1.2 2.8-3 3.5-.3.1-.1.6.3.7 1 .2 1.8.5 2 1 .2.4 0 .8-.1 1.1-.1.3 0 .5.3.5.4 0 1-.3 1.8-.3.9 0 1.4.6 2.6.6s1.7-.6 2.6-.6c.8 0 1.4.3 1.8.3.3 0 .4-.2.3-.5-.1-.3-.3-.7-.1-1.1.2-.5 1-.8 2-1 .4-.1.6-.6.3-.7-1.8-.7-2.8-2-3-3.5.6-.2 1.1-.5 1.1-.9 0-.5-.7-.8-1.3-1 .1-1.1.2-2.8-.2-3.8C16.7 3.3 14.76 2 12 2z" />
            </svg>
        ),
    },
    {
        name: 'X',
        url: 'https://x.com',
        color: 'from-zinc-700 to-zinc-900',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        name: 'YouTube',
        url: 'https://youtube.com',
        color: 'from-red-600 to-red-700',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        name: 'Spotify',
        url: 'https://open.spotify.com',
        color: 'from-green-500 to-green-600',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.394-.756.52-1.15.28-3.153-1.928-7.126-2.368-11.805-1.295-.453.104-.912-.178-1.017-.63-.105-.453.178-.912.63-1.017 5.12-1.173 9.492-.686 13.062 1.503.394.24.52.756.28 1.15zm1.487-3.32c-.303.49-.938.647-1.428.344-3.6-2.213-9.088-2.836-13.197-1.554-.543.169-1.127-.133-1.296-.676-.169-.543.133-1.127.676-1.296 4.7-1.464 10.748-.77 14.9 1.776.49.303.647.938.345 1.406zm.134-3.468C14.887 7.994 8.63 7.788 5.03 8.878c-.655.199-1.353-.17-1.551-.825-.199-.655.17-1.353.825-1.551 4.168-1.26 11.082-1.01 15.748 1.76a1.14 1.14 0 0 1 .425 1.565c-.28.468-.891.614-1.335.335z" />
            </svg>
        ),
    },
    {
        name: 'TikTok',
        url: 'https://tiktok.com',
        color: 'from-[#000000] to-zinc-800',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.6-1.62-.93-.01 2.21.03 4.41-.01 6.61-.09 1.95-.73 3.86-1.92 5.41-1.67 2.19-4.21 3.51-6.9 3.8-2.31.24-4.71-.05-6.73-1.38-2.6-1.7-4.14-4.66-3.9-7.79.23-2.91 1.97-5.55 4.54-6.85 2-.99 4.36-1.24 6.54-.83v3.9c-1.26-.64-2.81-.8-4.22-.38-1.87.56-3.23 2.18-3.45 4.11-.22 2.01.76 4 2.45 5.05 1.83 1.14 4.31 1.05 5.92-.3 1.45-1.22 2.22-3.1 2.22-5.01-.01-4.85-.02-9.71 0-14.56.01-.01.03-.01.05 0z" />
            </svg>
        ),
    },
    {
        name: 'Maps',
        url: 'https://maps.google.com',
        color: 'from-emerald-500 to-teal-600',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12.001 0a7.994 7.994 0 0 0-8 8.003c0 1.905.748 3.738 1.763 5.372l6.237 9.875 6.236-9.875A8.026 8.026 0 0 0 20 8.003 7.994 7.994 0 0 0 12.001 0zm0 11.517a3.517 3.517 0 1 1 .002-7.034 3.517 3.517 0 0 1-.002 7.034z" />
            </svg>
        ),
    },
    {
        name: 'Netflix',
        url: 'https://netflix.com',
        color: 'from-red-600 to-red-900', // Netflix red gradient approximation
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 md:w-16 md:h-16">
                <path d="M5.398 22.185c-1.282.493-2.473.805-3.52 1.054V.75h4.15l7.108 15.655V.75h3.985v21.658c-1.11-.278-2.378-.62-3.714-1.092L6.155 5.567v16.618H5.398z" />
            </svg>
        ),
    },
];

export function SocialsWidget({ id, isEditing }: { id?: string; isEditing?: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-6 w-full h-full gap-4 md:gap-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 w-full h-full max-w-2xl gap-3 md:gap-6">
                {SOCIALS.map(social => (
                    <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.name}
                        className={cn(
                            "rounded-2xl md:rounded-3xl flex items-center justify-center text-white h-full relative overflow-hidden group",
                            "bg-gradient-to-br shadow-xl hover:scale-105 active:scale-95 transition-all duration-300",
                            "border border-white/10 hover:border-white/30",
                            social.color
                        )}
                        style={{ minHeight: '100px' }}
                    >
                        {/* Base icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity scale-150">
                            {social.icon}
                        </div>

                        {/* Foreground icon */}
                        <div className="relative z-10 drop-shadow-2xl">
                            {social.icon}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
