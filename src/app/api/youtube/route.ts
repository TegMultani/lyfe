import { NextResponse } from 'next/server';

const CACHE_DURATION = 300; // 5 min
const cache: Record<string, { data: any; timestamp: number }> = {};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'popular'; // popular | search
    const region = searchParams.get('region') || 'CA';
    const q = searchParams.get('q') || '';
    const maxResults = searchParams.get('maxResults') || '12';

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    const cacheKey = `${type}:${region}:${q}:${maxResults}`;
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 1000) {
        return NextResponse.json(cached.data);
    }

    try {
        let url: string;

        if (type === 'search' && q) {
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=${maxResults}&regionCode=${region}&key=${apiKey}`;
        } else {
            // Most popular videos
            url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=${maxResults}&key=${apiKey}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
            const errText = await res.text();
            console.error('YouTube API error:', errText);
            throw new Error('YouTube API error');
        }

        const data = await res.json();

        // Normalize items
        const items = (data.items || []).map((item: any) => {
            const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId;
            return {
                videoId,
                title: item.snippet?.title,
                channel: item.snippet?.channelTitle,
                thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
                publishedAt: item.snippet?.publishedAt,
                viewCount: item.statistics?.viewCount || null,
            };
        });

        cache[cacheKey] = { data: items, timestamp: Date.now() };
        return NextResponse.json(items, {
            headers: { 'Cache-Control': `s-maxage=${CACHE_DURATION}, stale-while-revalidate` },
        });
    } catch (error) {
        console.error('YouTube fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 });
    }
}
