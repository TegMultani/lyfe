import { NextResponse } from 'next/server';

const WEATHER_LABELS: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm',
};

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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city')?.trim();

    if (!city) {
        return NextResponse.json({ error: 'City is required.' }, { status: 400 });
    }

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        if (!geoRes.ok) {
            throw new Error('Failed to geocode city.');
        }

        const geoData = await geoRes.json();
        const location = geoData?.results?.[0];

        if (!location) {
            return NextResponse.json({ error: 'City not found. Try another query.' }, { status: 404 });
        }

        const forecastRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`
        );

        if (!forecastRes.ok) {
            throw new Error('Failed to fetch forecast.');
        }

        const forecastData = await forecastRes.json();
        const current = forecastData?.current;
        const daily = forecastData?.daily;
        const hourly = forecastData?.hourly;

        const firstHourIndex = Array.isArray(hourly?.time)
            ? hourly.time.findIndex((time: string) => new Date(time).getTime() >= Date.now())
            : -1;
        const start = firstHourIndex >= 0 ? firstHourIndex : 0;

        const hourlyForecast: HourlyPoint[] = Array.from({ length: 12 }).map((_, idx) => ({
            time: hourly?.time?.[start + idx],
            temperature: hourly?.temperature_2m?.[start + idx],
            weatherCode: hourly?.weather_code?.[start + idx],
            isDay: Boolean(hourly?.is_day?.[start + idx]),
        })).filter((item) => item.time && Number.isFinite(item.temperature));

        const dailyForecast: DailyPoint[] = Array.from({ length: 5 }).map((_, idx) => ({
            date: daily?.time?.[idx],
            weatherCode: daily?.weather_code?.[idx],
            high: daily?.temperature_2m_max?.[idx],
            low: daily?.temperature_2m_min?.[idx],
        })).filter((item) => item.date && Number.isFinite(item.high) && Number.isFinite(item.low));

        return NextResponse.json(
            {
                city: location.name,
                country: location.country || '',
                admin: location.admin1 || '',
                temperature: current?.temperature_2m,
                feelsLike: current?.apparent_temperature,
                humidity: current?.relative_humidity_2m,
                windSpeed: current?.wind_speed_10m,
                weatherCode: current?.weather_code,
                weatherLabel: WEATHER_LABELS[current?.weather_code] || 'Current conditions',
                high: daily?.temperature_2m_max?.[0],
                low: daily?.temperature_2m_min?.[0],
                isDay: Boolean(current?.is_day),
                hourlyForecast,
                dailyForecast,
            },
            {
                headers: {
                    'Cache-Control': 's-maxage=600, stale-while-revalidate',
                },
            }
        );
    } catch (error) {
        console.error('Weather API error', error);
        return NextResponse.json({ error: 'Unable to load weather right now.' }, { status: 500 });
    }
}
