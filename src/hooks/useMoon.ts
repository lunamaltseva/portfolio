import { useEffect, useState } from 'react';
import { getMoonIllumination, getMoonPosition } from 'suncalc';
import { getTimezoneInfo } from '@countrystatecity/timezones';
import coords from '../data/timezoneCoords.json';

export interface MoonData {
  /** City the Moon is "seen from", derived from the IANA zone. */
  city: string;
  /** IANA timezone name resolved from the browser. */
  timezone: string;
  /** Observer latitude / longitude (approximate, from the timezone). */
  lat: number;
  lng: number;
  /** Illuminated fraction, 0 (new) → 1 (full). */
  fraction: number;
  /** true while waxing (new → full), false while waning. */
  waxing: boolean;
  /** Degrees to rotate the disk so the bright limb points the right way (its tilt). */
  rotation: number;
  /** Local time in the observer's zone, "HH:mm". */
  timeLabel: string;
  /** Local date in the observer's zone, "MMM DD, YYYY". */
  dateLabel: string;
}

const COORDS: Record<string, { lat: number; lng: number }> = coords;

/** Turn "America/Argentina/Buenos_Aires" into "Buenos Aires". */
function cityFromZone(zone: string): string {
  const last = zone.split('/').pop() ?? zone;
  return last.replace(/_/g, ' ');
}

export function useMoon(): MoonData | null {
  const [data, setData] = useState<MoonData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function compute() {
      const now = new Date();
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      // Confirm/normalise the zone through the timezone package; fall back gracefully.
      let timezone = zone;
      try {
        const info = await getTimezoneInfo(zone);
        if (info?.timezone) timezone = info.timezone;
      } catch {
        /* keep the browser-reported zone */
      }

      const { lat, lng } = COORDS[timezone] ?? { lat: 0, lng: 0 };

      // Phase (location-independent) and tilt (needs the observer's position).
      const illum = getMoonIllumination(now);
      const pos = getMoonPosition(now, lat, lng);

      // Zenith angle of the bright limb: how the crescent tilts for this observer.
      // Our disk is drawn with the bright limb pointing right (+x = 90° from "up"),
      // so rotate by the zenith angle minus that baseline.
      const zenithAngle = illum.angle - pos.parallacticAngle;
      const rotation = zenithAngle - 90;

      // Use the device's own locale so the 12h/24h choice follows its preferences.
      const timeLabel = new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(now);

      const dateLabel = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).format(now);

      if (!cancelled) {
        setData({
          city: cityFromZone(timezone),
          timezone,
          lat,
          lng,
          fraction: illum.fraction,
          waxing: illum.waxing,
          rotation,
          timeLabel,
          dateLabel,
        });
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
