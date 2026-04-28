import { useEffect, useMemo, useRef, useState } from "react";
import { ArtworkCard } from "./components/ArtworkCard";
import { ControlPanel } from "./components/ControlPanel";
import { TrailMap } from "./components/TrailMap";
import { trail } from "./data/trail";
import { useGeolocation } from "./hooks/useGeolocation";
import { haversineMeters, pointAlongPath } from "./lib/geo";
import type { LatLng } from "./lib/types";

type Mode = "simulate" | "live";

export default function App() {
  const [mode, setMode] = useState<Mode>("simulate");
  const [progress, setProgress] = useState(0);
  const [proximityRadiusM, setProximityRadiusM] = useState(500);
  const [activePoiId, setActivePoiId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const lastNotifiedRef = useRef<string | null>(null);

  const { position: livePosition, error: liveError } = useGeolocation(mode === "live");

  const hiker: LatLng | null = useMemo(() => {
    if (mode === "live") return livePosition;
    return pointAlongPath(trail.path, progress);
  }, [mode, progress, livePosition]);

  // Distances from hiker to every POI.
  const distances = useMemo(() => {
    if (!hiker) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const poi of trail.pois) m.set(poi.id, haversineMeters(hiker, poi.coord));
    return m;
  }, [hiker]);

  // Nearest POI within the alert radius.
  const nearestNearby = useMemo(() => {
    let best: { id: string; d: number } | null = null;
    for (const [id, d] of distances) {
      if (d <= proximityRadiusM && (!best || d < best.d)) best = { id, d };
    }
    return best;
  }, [distances, proximityRadiusM]);

  // Auto-open the card when entering a POI's radius (once per visit).
  useEffect(() => {
    if (!nearestNearby) {
      lastNotifiedRef.current = null;
      return;
    }
    if (lastNotifiedRef.current === nearestNearby.id) return;
    lastNotifiedRef.current = nearestNearby.id;
    if (!dismissed.has(nearestNearby.id)) {
      setActivePoiId(nearestNearby.id);
    }
  }, [nearestNearby, dismissed]);

  const activePoi = activePoiId
    ? trail.pois.find((p) => p.id === activePoiId) ?? null
    : null;

  return (
    <div className="h-full flex flex-col">
      <ControlPanel
        trailName={trail.name}
        trailDescription={trail.description}
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          setDismissed(new Set());
          lastNotifiedRef.current = null;
        }}
        progress={progress}
        onProgressChange={setProgress}
        proximityRadiusM={proximityRadiusM}
        onRadiusChange={setProximityRadiusM}
        liveError={liveError}
      />

      <div className="relative flex-1">
        <TrailMap
          path={trail.path}
          pois={trail.pois}
          hiker={hiker}
          activePoiId={nearestNearby?.id ?? null}
          proximityRadiusM={proximityRadiusM}
          onPoiClick={(id) => {
            setDismissed((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            setActivePoiId(id);
          }}
        />

        {nearestNearby && !activePoi && dismissed.has(nearestNearby.id) && (
          <button
            onClick={() => setActivePoiId(nearestNearby.id)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[900] bg-forest-700 hover:bg-forest-800 text-white text-sm px-4 py-2 rounded-full shadow-lg"
          >
            Reopen artwork ·{" "}
            {trail.pois.find((p) => p.id === nearestNearby.id)?.name}
          </button>
        )}
      </div>

      {activePoi && (
        <ArtworkCard
          poi={activePoi}
          distanceM={distances.get(activePoi.id) ?? 0}
          onDismiss={() => {
            setActivePoiId(null);
            setDismissed((prev) => new Set(prev).add(activePoi.id));
          }}
        />
      )}
    </div>
  );
}
