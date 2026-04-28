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
    <div className="bg-white border-b border-forest-100 px-4 py-3 space-y-3">
      <div>
        <h1 className="text-base font-semibold text-forest-900 leading-tight">
          {trailName}
        </h1>
        <p className="text-xs text-forest-700 mt-0.5">{trailDescription}</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="inline-flex rounded-md border border-forest-100 overflow-hidden">
          <button
            onClick={() => onModeChange("simulate")}
            className={`px-3 py-1.5 ${
              mode === "simulate"
                ? "bg-forest-700 text-white"
                : "bg-white text-forest-800 hover:bg-forest-50"
            }`}
          >
            Simulate
          </button>
          <button
            onClick={() => onModeChange("live")}
            className={`px-3 py-1.5 border-l border-forest-100 ${
              mode === "live"
                ? "bg-forest-700 text-white"
                : "bg-white text-forest-800 hover:bg-forest-50"
            }`}
          >
            Live GPS
          </button>
        </div>
        <label className="ml-auto flex items-center gap-2 text-xs text-forest-700">
          Alert radius
          <select
            value={proximityRadiusM}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="border border-forest-100 rounded px-1.5 py-1 text-xs bg-white"
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
          <label className="text-xs text-forest-700 flex justify-between">
            <span>Walk along the trail</span>
            <span className="tabular-nums">{Math.round(progress * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => onProgressChange(Number(e.target.value) / 1000)}
            className="w-full accent-forest-700"
          />
        </div>
      ) : (
        <div className="text-xs text-forest-700">
          {liveError
            ? `GPS error: ${liveError}`
            : "Using your device location. Allow access when prompted."}
        </div>
      )}
    </div>
  );
}
