'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLatBoundsLike } from 'maplibre-gl';
import { Car, Gauge, MapPinned } from 'lucide-react';

const VANCOUVER_BOUNDS: LngLatBoundsLike = [
  [-123.35, 49.0],
  [-122.2, 49.46],
];

const START_POS = {
  lng: -123.1207,
  lat: 49.2827,
  heading: 95,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function DrivePage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const frameRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const carRef = useRef({ ...START_POS, speed: 0 });
  const [speedKph, setSpeedKph] = useState(0);
  const [coordsLabel, setCoordsLabel] = useState(`${START_POS.lat.toFixed(5)}, ${START_POS.lng.toFixed(5)}`);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [START_POS.lng, START_POS.lat],
      zoom: 13.8,
      pitch: 62,
      bearing: START_POS.heading,
      maxBounds: VANCOUVER_BOUNDS,
      antialias: true,
    });

    const carEl = document.createElement('div');
    carEl.className =
      'flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-400/85 shadow-[0_0_20px_rgba(34,211,238,0.65)]';
    carEl.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="black" stroke-width="2"><path d="M5 14h14M6 10l2-3h8l2 3M7 14v3m10-3v3"/></svg>';

    markerRef.current = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map' })
      .setLngLat([START_POS.lng, START_POS.lat])
      .addTo(map);

    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    const animate = () => {
      const car = carRef.current;
      const keys = keysRef.current;
      const acceleration = 0.035;
      const friction = 0.018;
      const maxSpeed = 0.22;
      const reverseSpeed = -0.1;
      const turnScale = 2.4;

      if (keys.w || keys.arrowup) car.speed = clamp(car.speed + acceleration, reverseSpeed, maxSpeed);
      if (keys.s || keys.arrowdown) car.speed = clamp(car.speed - acceleration, reverseSpeed, maxSpeed);
      if (!(keys.w || keys.arrowup || keys.s || keys.arrowdown)) {
        if (car.speed > 0) car.speed = Math.max(0, car.speed - friction);
        if (car.speed < 0) car.speed = Math.min(0, car.speed + friction);
      }

      const speedRatio = Math.min(1, Math.abs(car.speed) / maxSpeed);
      if (keys.a || keys.arrowleft) car.heading -= turnScale * (0.25 + speedRatio);
      if (keys.d || keys.arrowright) car.heading += turnScale * (0.25 + speedRatio);

      const radians = (car.heading * Math.PI) / 180;
      const latStep = Math.cos(radians) * car.speed * 0.0016;
      const lngStep = Math.sin(radians) * car.speed * 0.0022;

      car.lat = clamp(car.lat + latStep, 49.0, 49.46);
      car.lng = clamp(car.lng + lngStep, -123.35, -122.2);

      markerRef.current?.setLngLat([car.lng, car.lat]).setRotation(car.heading);

      map.easeTo({
        center: [car.lng, car.lat],
        duration: 140,
        pitch: 62,
        zoom: 15.3,
        bearing: car.heading,
        easing: t => t,
      });

      setSpeedKph(Math.round(Math.abs(car.speed) * 600));
      setCoordsLabel(`${car.lat.toFixed(5)}, ${car.lng.toFixed(5)}`);
      frameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    map.on('load', () => {
      frameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      markerRef.current?.remove();
      map.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black p-4 pb-24 md:pb-6 md:pl-28 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="rounded-xl bg-cyan-500/15 p-2.5">
            <Car className="h-7 w-7 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Metro Vancouver Free Drive</h1>
            <p className="mt-0.5 text-sm text-white/45">
              WASD / Arrow Keys to roam. Map tiles are streamed in real time and constrained to your selected Metro Vancouver area.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div ref={mapContainerRef} className="h-[70vh] min-h-[520px] w-full" />

          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <Gauge className="h-3.5 w-3.5" /> Speed
              </div>
              <div className="mt-1 text-xl font-semibold text-white">{speedKph} km/h</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-2 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                <MapPinned className="h-3.5 w-3.5" /> Position
              </div>
              <div className="mt-1 text-sm font-medium text-white/90">{coordsLabel}</div>
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
            W/S accelerate & brake • A/D steer • Arrow keys also work
          </div>
        </div>
      </div>
    </div>
  );
}
