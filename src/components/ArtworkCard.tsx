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
    <div className="relative w-full aspect-[4/3] overflow-hidden border border-ink-900">
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ece7dc" />
            <stop offset="100%" stopColor="#c9c0ac" />
          </linearGradient>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0.35 0" />
          </filter>
        </defs>
        <rect width="400" height="300" fill="url(#sky)" />
        <polygon points="0,300 90,140 160,210 240,110 320,200 400,150 400,300" fill="#3a352d" />
        <polygon points="0,300 60,210 140,250 210,190 290,240 360,210 400,240 400,300" fill="#26221c" />
        <polygon points="0,300 50,270 140,280 210,260 290,275 360,265 400,280 400,300" fill="#1a1815" />
        <rect width="400" height="300" filter="url(#grain)" opacity="0.7" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end text-center p-4 bg-gradient-to-t from-black/70 via-black/25 to-transparent">
        <div className="text-bone-100 font-serif italic text-lg leading-tight">
          {title}
        </div>
        <div className="text-bone-200 text-[10px] mt-2 uppercase tracking-widest">
          {author}
          {year ? ` · ${year}` : ""}
        </div>
        <div className="text-bone-300 text-[9px] mt-2 uppercase tracking-widest">
          Illustrated placeholder
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
      <div className="bg-bone-50 border border-ink-900 shadow-2xl max-h-[82vh] overflow-y-auto">
        <div className="sticky top-0 bg-bone-50 border-b border-ink-900 px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-ink-500">
              {distanceM < 1
                ? "You are here"
                : `${Math.round(distanceM)} m · Approach`}
            </div>
            <h2 className="font-mono text-[13px] uppercase tracking-widest text-ink-900 mt-1 leading-tight">
              {poi.name}
            </h2>
            <p className="text-[11px] text-ink-500 mt-1 leading-snug">
              {poi.blurb}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-ink-700 hover:text-ink-900 text-lg leading-none px-2 py-1 border border-ink-900"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-4">
          {art.kind === "image" ? (
            <figure className="space-y-3">
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
                  className="w-full border border-ink-900 bg-bone-200"
                  style={{ filter: "grayscale(0.55) contrast(1.02)" }}
                  loading="lazy"
                  onError={() => setImageFailed(true)}
                />
              )}
              <figcaption className="text-[10px] uppercase tracking-widest text-ink-500">
                <span className="text-ink-900">{art.title}</span> · {art.author}
                {art.year ? ` · ${art.year}` : ""}
                <div className="text-[9px] text-ink-400 mt-1 normal-case tracking-normal">
                  {art.source}
                </div>
              </figcaption>
            </figure>
          ) : (
            <figure className="space-y-3">
              <blockquote className="font-serif text-[18px] leading-snug text-ink-900 border-l-2 border-ink-900 pl-4 italic">
                {art.excerpt}
              </blockquote>
              <figcaption className="text-[10px] uppercase tracking-widest text-ink-500">
                <span className="text-ink-900">{art.title}</span> · {art.author}
                {art.year ? ` · ${art.year}` : ""}
                <div className="text-[9px] text-ink-400 mt-1 normal-case tracking-normal">
                  {art.source}
                </div>
              </figcaption>
            </figure>
          )}
        </div>

        {total > 1 && (
          <div className="px-4 pb-4 flex items-center justify-between gap-3 border-t border-ink-900/20 pt-3">
            <button
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              className="px-3 py-1.5 text-[10px] uppercase tracking-widest border border-ink-900 bg-bone-100 text-ink-900 hover:bg-bone-200"
            >
              ← Prev
            </button>
            <div className="text-[10px] uppercase tracking-widest text-ink-500 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>
            <button
              onClick={() => setIndex((i) => (i + 1) % total)}
              className="px-3 py-1.5 text-[10px] uppercase tracking-widest bg-ink-900 text-bone-100 hover:bg-ink-700"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
