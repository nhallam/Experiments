import { useEffect, useState } from "react";
import type { POI } from "../lib/types";

type Props = {
  poi: POI;
  distanceM: number;
  onDismiss: () => void;
};

function PlaceholderArt({
  title,
  author,
  year,
}: {
  title: string;
  author: string;
  year?: number;
}) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-forest-100">
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3e8c8" />
            <stop offset="60%" stopColor="#e7d39a" />
            <stop offset="100%" stopColor="#c9a86a" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#sky)" />
        <circle cx="310" cy="70" r="28" fill="#fff5d8" opacity="0.85" />
        <polygon points="0,300 80,150 150,210 220,120 290,200 360,140 400,220 400,300" fill="#36502d" />
        <polygon points="0,300 60,200 130,250 190,180 260,240 320,200 400,260 400,300" fill="#2b4023" />
        <polygon points="0,300 50,260 130,280 200,250 280,275 360,255 400,280 400,300" fill="#1f2f1a" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-4 bg-gradient-to-t from-black/55 via-black/15 to-transparent">
        <div className="text-white font-serif text-lg leading-tight drop-shadow">
          {title}
        </div>
        <div className="text-white/90 text-xs mt-1 drop-shadow">
          {author}
          {year ? `, ${year}` : ""}
        </div>
        <div className="text-white/70 text-[10px] mt-2 uppercase tracking-wide">
          Image unavailable — illustrated placeholder
        </div>
      </div>
    </div>
  );
}

export function ArtworkCard({ poi, distanceM, onDismiss }: Props) {
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const art = poi.artworks[index];
  const total = poi.artworks.length;

  useEffect(() => {
    setImageFailed(false);
  }, [index, poi.id]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] sm:inset-auto sm:bottom-6 sm:right-6 sm:max-w-md">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-forest-100 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-forest-100 px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-forest-600 font-semibold">
              {distanceM < 1
                ? "You're here"
                : `${Math.round(distanceM)} m away`}
            </div>
            <h2 className="text-lg font-semibold text-forest-900">{poi.name}</h2>
            <p className="text-sm text-forest-700 mt-1">{poi.blurb}</p>
          </div>
          <button
            onClick={onDismiss}
            className="text-forest-700 hover:text-forest-900 text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-4">
          {art.kind === "image" ? (
            <figure className="space-y-2">
              {imageFailed ? (
                <PlaceholderArt
                  title={art.title}
                  author={art.author}
                  year={art.year}
                />
              ) : (
                <img
                  src={art.imageUrl}
                  alt={`${art.title} by ${art.author}`}
                  className="w-full rounded-lg border border-forest-100 bg-forest-50"
                  loading="lazy"
                  onError={() => setImageFailed(true)}
                />
              )}
              <figcaption className="text-sm text-forest-800">
                <span className="font-semibold">{art.title}</span> · {art.author}
                {art.year ? `, ${art.year}` : ""}
                <div className="text-xs text-forest-600 mt-1">{art.source}</div>
              </figcaption>
            </figure>
          ) : (
            <figure className="space-y-2">
              <blockquote className="font-serif text-[17px] leading-relaxed text-forest-900 border-l-4 border-forest-500 pl-4 italic">
                {art.excerpt}
              </blockquote>
              <figcaption className="text-sm text-forest-800">
                <span className="font-semibold">{art.title}</span> — {art.author}
                {art.year ? `, ${art.year}` : ""}
                <div className="text-xs text-forest-600 mt-1">{art.source}</div>
              </figcaption>
            </figure>
          )}
        </div>

        {total > 1 && (
          <div className="px-4 pb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              className="px-3 py-2 text-sm rounded-md bg-forest-50 hover:bg-forest-100 text-forest-800 font-medium"
            >
              ← Previous
            </button>
            <div className="text-xs text-forest-600">
              {index + 1} of {total}
            </div>
            <button
              onClick={() => setIndex((i) => (i + 1) % total)}
              className="px-3 py-2 text-sm rounded-md bg-forest-700 hover:bg-forest-800 text-white font-medium"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
