import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const REVALIDATE_SECONDS = 600;

const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'mediaContent', { keepArray: false }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
            ['enclosure', 'enclosure', { keepArray: false }],
        ],
    },
});

const FEEDS: Record<string, string[]> = {
    World: [
        'http://feeds.bbci.co.uk/news/world/rss.xml',
        'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        'https://www.aljazeera.com/xml/rss/all.xml',
    ],
    Canada: [
        'https://www.cbc.ca/webfeed/rss/rss-canada',
        'https://www.ctvnews.ca/rss/ctvnews-ca-top-stories-public-rss-1.822009',
        'https://globalnews.ca/feed/',
    ],
    Tech: [
        'https://www.theverge.com/rss/index.xml',
        'https://techcrunch.com/feed/',
        'https://www.wired.com/feed/rss',
        'https://feeds.arstechnica.com/arstechnica/index',
    ],
    Finance: [
        'https://business.financialpost.com/feed/',
        'https://www.cnbc.com/id/10000664/device/rss/rss.html',
        'https://finance.yahoo.com/news/rssindex',
    ],
};

function extractImage(item: any): string | null {
    // Try media:content
    if (item.mediaContent && item.mediaContent.$?.url) return item.mediaContent.$.url;
    // Try media:thumbnail
    if (item.mediaThumbnail && item.mediaThumbnail.$?.url) return item.mediaThumbnail.$.url;
    // Try enclosure
    if (item.enclosure?.url && item.enclosure?.type?.startsWith('image')) return item.enclosure.url;
    if (item.enclosure?.url) return item.enclosure.url;
    // Try to find <img> in content
    const content = item['content:encoded'] || item.content || '';
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch) return imgMatch[1];
    return null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as string;

    if (!category || !FEEDS[category]) {
        return NextResponse.json({ error: 'Invalid or missing category' }, { status: 400 });
    }

    const urls = FEEDS[category];

    try {
        const fetchPromises = urls.map(async (url) => {
            try {
                const feed = await parser.parseURL(url);
                return feed.items.map((item: any) => ({
                    title: item.title,
                    source: feed.title || 'Unknown Source',
                    publishedTime: item.isoDate || item.pubDate || new Date().toISOString(),
                    summary: item.contentSnippet?.slice(0, 200) || item.summary?.slice(0, 200) || null,
                    link: item.link,
                    image: extractImage(item),
                })).slice(0, 8);
            } catch (err) {
                console.error(`Failed to parse feed ${url}`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const flattened = results.flat().sort((a, b) =>
            new Date(b.publishedTime).getTime() - new Date(a.publishedTime).getTime()
        );

        return NextResponse.json(flattened, {
            headers: {
                'Cache-Control': `s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate`,
            },
        });
    } catch (error) {
        console.error('Error fetching RSS feeds:', error);
        return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
    }
}
