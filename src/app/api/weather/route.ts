import { NextResponse } from 'next/server';

const WEATHER_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: 'clear' },
  1: { label: 'Mainly clear', icon: 'partly' },
  2: { label: 'Partly cloudy', icon: 'partly' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Depositing rime fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'rain' },
  53: { label: 'Moderate drizzle', icon: 'rain' },
  55: { label: 'Dense drizzle', icon: 'rain' },
  56: { label: 'Light freezing drizzle', icon: 'rain' },
  57: { label: 'Dense freezing drizzle', icon: 'rain' },
  61: { label: 'Slight rain', icon: 'rain' },
  63: { label: 'Moderate rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Light freezing rain', icon: 'rain' },
  67: { label: 'Heavy freezing rain', icon: 'rain' },
  71: { label: 'Slight snow', icon: 'snow' },
  73: { label: 'Moderate snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Rain showers', icon: 'rain' },
  81: { label: 'Rain showers', icon: 'rain' },
  82: { label: 'Violent rain showers', icon: 'storm' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm with hail', icon: 'storm' },
  99: { label: 'Thunderstorm with hail', icon: 'storm' },
};

async function geocodeCity(city: string) {
  const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geoUrl.searchParams.set('name', city);
  geoUrl.searchParams.set('count', '5');
  geoUrl.searchParams.set('language', 'en');
  geoUrl.searchParams.set('format', 'json');

  const geoRes = await fetch(geoUrl, { cache: 'no-store' });
  if (!geoRes.ok) return null;
  const geoData = await geoRes.json();
  return geoData.results?.[0] || null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get('city') || 'Toronto').trim();

    const location = await geocodeCity(city);

    if (!location) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', String(location.latitude));
    weatherUrl.searchParams.set('longitude', String(location.longitude));
    weatherUrl.searchParams.set('current', 'temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m');
    weatherUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset');
    weatherUrl.searchParams.set('timezone', 'auto');
    weatherUrl.searchParams.set('forecast_days', '5');

    const weatherRes = await fetch(weatherUrl, { cache: 'no-store' });
    if (!weatherRes.ok) {
      return NextResponse.json({ error: 'Failed weather request' }, { status: weatherRes.status });
    }

    const data = await weatherRes.json();
    const code = data.current?.weather_code;

    return NextResponse.json({
      location: {
        name: location.name,
        admin1: location.admin1,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      current: {
        ...data.current,
        summary: WEATHER_CODES[code]?.label || 'Current conditions',
        icon: WEATHER_CODES[code]?.icon || 'partly',
      },
      daily:
        data.daily?.time?.map((time: string, index: number) => {
          const dayCode = data.daily.weather_code?.[index];
          return {
            time,
            weatherCode: dayCode,
            summary: WEATHER_CODES[dayCode]?.label || 'Forecast',
            icon: WEATHER_CODES[dayCode]?.icon || 'partly',
            tempMax: data.daily.temperature_2m_max?.[index],
            tempMin: data.daily.temperature_2m_min?.[index],
            sunrise: data.daily.sunrise?.[index],
            sunset: data.daily.sunset?.[index],
          };
        }) || [],
    });
  } catch {
    return NextResponse.json({ error: 'Unable to load weather' }, { status: 500 });
  }
}
