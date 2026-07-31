/**
 * Where the person looking at the globe is.
 *
 * Two sources, in order of how much they cost the user:
 *
 *  1. Their time zone. Free, instant, no prompt, and good to a city — enough to
 *     draw a line from roughly the right place the moment the page loads.
 *  2. navigator.geolocation. Exact, but it puts a permission prompt on screen,
 *     so we only ask once the user has actually opened a dream and the line is
 *     about to mean something.
 */

export type ViewerLocation = {
  lat: number;
  lng: number;
  /** Shown next to the line. "Approx." while we're still on the time zone. */
  label: string;
  precise: boolean;
};

/**
 * IANA zone to the city it's named after. Not a complete list — the long tail
 * falls back to the zone's region, and then to nothing at all, which just means
 * no line until the user grants location.
 */
const ZONE_COORDS: Record<string, [number, number, string]> = {
  "Europe/London": [51.51, -0.13, "London"],
  "Europe/Dublin": [53.35, -6.26, "Dublin"],
  "Europe/Lisbon": [38.72, -9.14, "Lisbon"],
  "Europe/Madrid": [40.42, -3.7, "Madrid"],
  "Europe/Paris": [48.86, 2.35, "Paris"],
  "Europe/Brussels": [50.85, 4.35, "Brussels"],
  "Europe/Amsterdam": [52.37, 4.9, "Amsterdam"],
  "Europe/Berlin": [52.52, 13.4, "Berlin"],
  "Europe/Zurich": [47.38, 8.54, "Zurich"],
  "Europe/Vienna": [48.21, 16.37, "Vienna"],
  "Europe/Prague": [50.08, 14.44, "Prague"],
  "Europe/Rome": [41.9, 12.5, "Rome"],
  "Europe/Warsaw": [52.23, 21.01, "Warsaw"],
  "Europe/Stockholm": [59.33, 18.07, "Stockholm"],
  "Europe/Oslo": [59.91, 10.75, "Oslo"],
  "Europe/Copenhagen": [55.68, 12.57, "Copenhagen"],
  "Europe/Helsinki": [60.17, 24.94, "Helsinki"],
  "Europe/Athens": [37.98, 23.73, "Athens"],
  "Europe/Bucharest": [44.43, 26.1, "Bucharest"],
  "Europe/Budapest": [47.5, 19.04, "Budapest"],
  "Europe/Kyiv": [50.45, 30.52, "Kyiv"],
  "Europe/Istanbul": [41.01, 28.98, "Istanbul"],
  "Europe/Moscow": [55.76, 37.62, "Moscow"],
  "America/New_York": [40.71, -74.01, "New York"],
  "America/Toronto": [43.65, -79.38, "Toronto"],
  "America/Chicago": [41.88, -87.63, "Chicago"],
  "America/Denver": [39.74, -104.99, "Denver"],
  "America/Phoenix": [33.45, -112.07, "Phoenix"],
  "America/Los_Angeles": [34.05, -118.24, "Los Angeles"],
  "America/Vancouver": [49.28, -123.12, "Vancouver"],
  "America/Mexico_City": [19.43, -99.13, "Mexico City"],
  "America/Bogota": [4.71, -74.07, "Bogotá"],
  "America/Lima": [-12.05, -77.04, "Lima"],
  "America/Santiago": [-33.45, -70.67, "Santiago"],
  "America/Sao_Paulo": [-23.55, -46.63, "São Paulo"],
  "America/Argentina/Buenos_Aires": [-34.6, -58.38, "Buenos Aires"],
  "Africa/Casablanca": [33.57, -7.59, "Casablanca"],
  "Africa/Lagos": [6.52, 3.38, "Lagos"],
  "Africa/Cairo": [30.04, 31.24, "Cairo"],
  "Africa/Nairobi": [-1.29, 36.82, "Nairobi"],
  "Africa/Johannesburg": [-26.2, 28.05, "Johannesburg"],
  "Asia/Jerusalem": [31.78, 35.22, "Jerusalem"],
  "Asia/Dubai": [25.2, 55.27, "Dubai"],
  "Asia/Karachi": [24.86, 67.01, "Karachi"],
  "Asia/Kolkata": [19.08, 72.88, "Mumbai"],
  "Asia/Dhaka": [23.81, 90.41, "Dhaka"],
  "Asia/Bangkok": [13.76, 100.5, "Bangkok"],
  "Asia/Jakarta": [-6.21, 106.85, "Jakarta"],
  "Asia/Singapore": [1.35, 103.82, "Singapore"],
  "Asia/Hong_Kong": [22.32, 114.17, "Hong Kong"],
  "Asia/Shanghai": [31.23, 121.47, "Shanghai"],
  "Asia/Taipei": [25.03, 121.57, "Taipei"],
  "Asia/Seoul": [37.57, 126.98, "Seoul"],
  "Asia/Tokyo": [35.68, 139.69, "Tokyo"],
  "Australia/Perth": [-31.95, 115.86, "Perth"],
  "Australia/Adelaide": [-34.93, 138.6, "Adelaide"],
  "Australia/Brisbane": [-27.47, 153.03, "Brisbane"],
  "Australia/Melbourne": [-37.81, 144.96, "Melbourne"],
  "Australia/Sydney": [-33.87, 151.21, "Sydney"],
  "Pacific/Auckland": [-36.85, 174.76, "Auckland"],
  "Pacific/Honolulu": [21.31, -157.86, "Honolulu"],
};

/** A best guess with no permission prompt, or null if the zone is unknown. */
export function locationFromTimeZone(): ViewerLocation | null {
  let zone: string | undefined;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
  const hit = zone ? ZONE_COORDS[zone] : undefined;
  if (!hit) return null;
  const [lat, lng, city] = hit;
  return { lat, lng, label: `Near ${city}`, precise: false };
}

/** Resolves to null rather than rejecting — a declined prompt isn't an error. */
export function requestPreciseLocation(): Promise<ViewerLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
          label: "You are here",
          precise: true,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  });
}
