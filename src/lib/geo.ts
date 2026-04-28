import type { LatLng } from "./types";

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}

// Total length of a polyline in meters.
export function pathLengthMeters(path: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineMeters(path[i - 1], path[i]);
  }
  return total;
}

// Linearly interpolate a point at `progress` (0..1) along the polyline.
export function pointAlongPath(path: LatLng[], progress: number): LatLng {
  if (path.length === 0) return [0, 0];
  if (path.length === 1) return path[0];
  const clamped = Math.max(0, Math.min(1, progress));
  const total = pathLengthMeters(path);
  if (total === 0) return path[0];
  let target = clamped * total;
  for (let i = 1; i < path.length; i++) {
    const seg = haversineMeters(path[i - 1], path[i]);
    if (target <= seg) {
      const t = seg === 0 ? 0 : target / seg;
      const [lat1, lon1] = path[i - 1];
      const [lat2, lon2] = path[i];
      return [lat1 + (lat2 - lat1) * t, lon1 + (lon2 - lon1) * t];
    }
    target -= seg;
  }
  return path[path.length - 1];
}
