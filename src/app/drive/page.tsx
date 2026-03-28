'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBoundsLike } from 'maplibre-gl';
import { Car, Flag, Gauge, MapPinned, Trophy, Zap } from 'lucide-react';

const VANCOUVER_BOUNDS: LngLatBoundsLike = [
  [-123.35, 49.0],
  [-122.2, 49.46],
];

const START_POS = {
  lng: -123.1216,
  lat: 49.2824,
  heading: 88,
};

const CHECKPOINTS: [number, number][] = [
  [-123.1216, 49.2824], // Downtown
  [-123.1205, 49.2488], // Oakridge corridor
  [-123.0411, 49.2212], // Burnaby / New West bridge area
  [-122.8891, 49.2441], // Coquitlam west
  [-122.8012, 49.1948], // Surrey / Fraser edge
  [-122.9501, 49.1218], // South Surrey
  [-123.1052, 49.171], // Richmond / Sea Island north
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toRad = (deg: number) => (deg * Math.PI) / 180;

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const formatTime = (ms: number) => {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const remainSec = (sec % 60).toString().padStart(2, '0');
  const centis = Math.floor((ms % 1000) / 10)
    .toString()
    .padStart(2, '0');
  return `${min}:${remainSec}.${centis}`;
};

export default function DrivePage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const frameRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const checkpointMarkerRefs = useRef<maplibregl.Marker[]>([]);
  const currentCheckpointRef = useRef(0);
  const raceStartRef = useRef<number | null>(null);

  const carRef = useRef({ ...START_POS, speed: 0 });

  const [speedKph, setSpeedKph] = useState(0);
  const [coordsLabel, setCoordsLabel] = useState(`${START_POS.lat.toFixed(5)}, ${START_POS.lng.toFixed(5)}`);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(1);
  const [lapsCompleted, setLapsCompleted] = useState(0);
  const [lapTime, setLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [START_POS.lng, START_POS.lat],
      zoom: 14.8,
      pitch: 68,
      bearing: START_POS.heading,
      maxBounds: VANCOUVER_BOUNDS,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    const carEl = document.createElement('div');
    carEl.className =
      'flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/50 bg-cyan-400/90 shadow-[0_0_26px_rgba(34,211,238,0.75)]';
    carEl.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="black" stroke-width="2"><path d="M5 14h14M6 10l2-3h8l2 3M7 14v3m10-3v3"/></svg>';

    markerRef.current = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map', pitchAlignment: 'map' })
      .setLngLat([START_POS.lng, START_POS.lat])
      .addTo(map);

    const drawRoute = () => {
      if (map.getSource('drive-route')) return;

      map.addSource('drive-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [...CHECKPOINTS, CHECKPOINTS[0]],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: 'drive-route-line',
        type: 'line',
        source: 'drive-route',
        paint: {
          'line-color': '#22d3ee',
          'line-opacity': 0.45,
          'line-width': 4,
        },
      });

      checkpointMarkerRefs.current = CHECKPOINTS.map((coords, idx) => {
        const checkpointEl = document.createElement('div');
        checkpointEl.className =
          idx === 0
            ? 'h-5 w-5 rounded-full border-2 border-emerald-300 bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
            : 'h-4 w-4 rounded-full border border-white/70 bg-white/70';
        return new maplibregl.Marker({ element: checkpointEl }).setLngLat(coords).addTo(map);
      });
    };

    const updateCheckpointMarkers = (activeIdx: number) => {
      checkpointMarkerRefs.current.forEach((marker, idx) => {
        const el = marker.getElement();
        if (idx === activeIdx) {
          el.className =
            'h-5 w-5 rounded-full border-2 border-amber-200 bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]';
        } else if (idx === 0) {
          el.className =
            'h-5 w-5 rounded-full border-2 border-emerald-300 bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.8)]';
        } else {
          el.className = 'h-4 w-4 rounded-full border border-white/70 bg-white/70';
        }
      });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    const animate = () => {
      const car = carRef.current;
      const keys = keysRef.current;

      const boosting = keys.shift;
      const acceleration = boosting ? 0.055 : 0.038;
      const friction = 0.02;
      const maxSpeed = boosting ? 0.28 : 0.22;
      const reverseSpeed = -0.1;
      const turnScale = boosting ? 2.05 : 2.6;

      if (keys.w || keys.arrowup) car.speed = clamp(car.speed + acceleration, reverseSpeed, maxSpeed);
      if (keys.s || keys.arrowdown) car.speed = clamp(car.speed - acceleration, reverseSpeed, maxSpeed);
      if (!(keys.w || keys.arrowup || keys.s || keys.arrowdown)) {
        if (car.speed > 0) car.speed = Math.max(0, car.speed - friction);
        if (car.speed < 0) car.speed = Math.min(0, car.speed + friction);
      }

      const speedRatio = Math.min(1, Math.abs(car.speed) / maxSpeed);
      if (keys.a || keys.arrowleft) car.heading -= turnScale * (0.2 + speedRatio);
      if (keys.d || keys.arrowright) car.heading += turnScale * (0.2 + speedRatio);

      const radians = toRad(car.heading);
      const latStep = Math.cos(radians) * car.speed * 0.0016;
      const lngStep = Math.sin(radians) * car.speed * 0.0022;

      car.lat = clamp(car.lat + latStep, 49.0, 49.46);
      car.lng = clamp(car.lng + lngStep, -123.35, -122.2);

      markerRef.current?.setLngLat([car.lng, car.lat]).setRotation(car.heading);

      map.easeTo({
        center: [car.lng, car.lat],
        duration: 110,
        pitch: 68,
        zoom: 15.8,
        bearing: car.heading,
        easing: t => t,
      });

      const activeCheckpoint = currentCheckpointRef.current;
      const [cpLng, cpLat] = CHECKPOINTS[activeCheckpoint];
      const distanceToCheckpoint = haversineMeters(car.lat, car.lng, cpLat, cpLng);

      if (distanceToCheckpoint <= 90) {
        const nextCheckpoint = (activeCheckpoint + 1) % CHECKPOINTS.length;
        currentCheckpointRef.current = nextCheckpoint;
        setCurrentCheckpoint(nextCheckpoint + 1);
        updateCheckpointMarkers(nextCheckpoint);

        if (activeCheckpoint === CHECKPOINTS.length - 1) {
          const now = performance.now();
          if (raceStartRef.current) {
            const completedLapMs = now - raceStartRef.current;
            setLapsCompleted(prev => prev + 1);
            setBestLapTime(prev => (prev === null ? completedLapMs : Math.min(prev, completedLapMs)));
          }
          raceStartRef.current = now;
          setLapTime(0);
        }
      }

      if (!raceStartRef.current) raceStartRef.current = performance.now();
      if (raceStartRef.current) setLapTime(performance.now() - raceStartRef.current);

      setSpeedKph(Math.round(Math.abs(car.speed) * 620));
      setCoordsLabel(`${car.lat.toFixed(5)}, ${car.lng.toFixed(5)}`);
      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    map.on('load', () => {
      drawRoute();
      updateCheckpointMarkers(0);
      frameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      checkpointMarkerRefs.current.forEach(marker => marker.remove());
      markerRef.current?.remove();
      map.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black p-4 pb-24 md:p-8 md:pb-6 md:pl-28">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="rounded-xl bg-cyan-500/15 p-2.5">
            <Car className="h-7 w-7 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Metro Vancouver Street Sprint</h1>
            <p className="mt-0.5 text-sm text-white/45">
              Race between checkpoints across Metro Vancouver. WASD/Arrows to drive, hold Shift for nitro boost.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div ref={mapContainerRef} className="h-[72vh] min-h-[540px] w-full" />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <Gauge className="h-3.5 w-3.5" /> Speed
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{speedKph} km/h</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <Flag className="h-3.5 w-3.5" /> Checkpoint
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{currentCheckpoint}/{CHECKPOINTS.length}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <Trophy className="h-3.5 w-3.5" /> Lap
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{formatTime(lapTime)}</div>
              <div className="text-[11px] text-white/60">Best: {bestLapTime ? formatTime(bestLapTime) : '--:--.--'}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <MapPinned className="h-3.5 w-3.5" /> Position
              </div>
              <div className="mt-1 text-sm font-medium text-white/90">{coordsLabel}</div>
              <div className="text-[11px] text-white/60">Laps done: {lapsCompleted}</div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs text-white/75 backdrop-blur-md">
            W/S accelerate • A/D steer • Shift nitro • Hit glowing checkpoints in order
          </div>

          <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90 backdrop-blur-md">
            <div className="flex items-center gap-2 uppercase tracking-[0.15em]">
              <Zap className="h-3.5 w-3.5" /> Boost Zone
            </div>
            <div className="mt-1 text-[11px] text-amber-100/70">Hold Shift to push higher top speed.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
