import { NextResponse } from 'next/server';

const CACHE_DURATION = 300; // 5 min cache
const cache: Record<string, { data: any; timestamp: number }> = {};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'quote';
    const range = searchParams.get('range') || '7d';

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 });
    }

    const cacheKey = `${type}:${symbol}:${range}`;
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 1000) {
        return NextResponse.json(cached.data);
    }

    try {
        let url: string;

        if (type === 'candle') {
            const YahooRanges = {
                '7d': '5d',
                '30d': '1mo',
                '90d': '3mo',
            };
            const yr = YahooRanges[range as keyof typeof YahooRanges] || '1mo';
            url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${yr}&interval=1d`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Yahoo Finance error');

            const yData = await res.json();
            const result = yData.chart?.result?.[0];

            if (!result) throw new Error('No chart data');

            const quote = result.indicators.quote[0];
            const data = {
                c: quote.close,
                h: quote.high,
                l: quote.low,
                o: quote.open,
                t: result.timestamp,
                s: 'ok'
            };
            cache[cacheKey] = { data, timestamp: Date.now() };
            return NextResponse.json(data);
        }

        if (type === 'search') {
            url = `https://finnhub.io/api/v1/search?q=${symbol}&token=${apiKey}`;
        } else { // type === 'quote'
            url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Finnhub error');

        const data = await res.json();
        cache[cacheKey] = { data, timestamp: Date.now() };
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching from Finnhub:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
