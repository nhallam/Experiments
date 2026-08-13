type Props = {
  trailName: string;
  trailDescription: string;
  mode: "simulate" | "live";
  onModeChange: (m: "simulate" | "live") => void;
  progress: number;
  onProgressChange: (p: number) => void;
  proximityRadiusM: number;
  onRadiusChange: (m: number) => void;
  liveError: string | null;
};

export function ControlPanel({
  trailName,
  trailDescription,
  mode,
  onModeChange,
  progress,
  onProgressChange,
  proximityRadiusM,
  onRadiusChange,
  liveError,
}: Props) {
  return (
    <header className="bg-bone-100 border-b border-ink-900">
      <div className="px-4 pt-3 pb-2 flex items-baseline gap-3 border-b border-ink-900/20">
        <span className="font-display text-3xl leading-none tracking-tight text-ink-900">
          ANSEL
        </span>
        <span className="text-[10px] uppercase tracking-widest text-ink-500">
          Trail Artworks · Estd 2025
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div>
          <h1 className="font-mono text-[11px] uppercase tracking-widest text-ink-900 leading-tight">
            {trailName}
          </h1>
          <p className="text-[11px] text-ink-500 mt-1 leading-snug">
            {trailDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-ink-900">
            <button
              onClick={() => onModeChange("simulate")}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest ${
                mode === "simulate"
                  ? "bg-ink-900 text-bone-100"
                  : "bg-bone-100 text-ink-900 hover:bg-bone-200"
              }`}
            >
              Simulate
            </button>
            <button
              onClick={() => onModeChange("live")}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border-l border-ink-900 ${
                mode === "live"
                  ? "bg-ink-900 text-bone-100"
                  : "bg-bone-100 text-ink-900 hover:bg-bone-200"
              }`}
            >
              Live GPS
            </button>
          </div>
          <label className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-500">
            Alert
            <select
              value={proximityRadiusM}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="border border-ink-900 bg-transparent px-2 py-1 text-[10px] uppercase tracking-widest text-ink-900 font-mono"
            >
              <option value={250}>250 m</option>
              <option value={500}>500 m</option>
              <option value={1000}>1 km</option>
              <option value={2000}>2 km</option>
            </select>
          </label>
        </div>

        {mode === "simulate" ? (
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-ink-500 flex justify-between">
              <span>Walk the trail</span>
              <span className="tabular-nums text-ink-900">
                {String(Math.round(progress * 100)).padStart(3, "0")}%
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(e) => onProgressChange(Number(e.target.value) / 1000)}
              className="w-full"
            />
          </div>
        ) : (
          <div className="text-[10px] uppercase tracking-widest text-ink-500">
            {liveError
              ? `GPS Error — ${liveError}`
              : "Using device location. Allow access when prompted."}
          </div>
        )}
      </div>
    </header>
  );
}
