# Trail Artworks

Mobile-friendly prototype: walk a section of the Pacific Crest Trail and, as
you approach famous viewpoints, the app surfaces paintings, photographs, and
writings made there.

This prototype covers the **PCT/JMT corridor from Tuolumne Meadows to Devil's
Postpile** with hand-curated points of interest.

## Run

```sh
pnpm install
pnpm dev
```

Then open the printed URL on your phone (same network) or laptop.

## Modes

- **Simulate** — drag the slider to walk south along the trail. Use this on a
  laptop or anywhere off-trail.
- **Live GPS** — uses the browser's `geolocation.watchPosition`. Requires
  HTTPS on most browsers (works on `localhost` for development).

When you're inside the alert radius of a POI, an artwork card opens
automatically. Adjust the radius in the top-right.

## Stack

Vite + React + TypeScript, Leaflet + react-leaflet for the map (OpenTopoMap
tiles), Tailwind for styling. No backend — trail data is in
`src/data/trail.ts`.

## Adding more trails / POIs

Each trail is a polyline (`path: [lat, lng][]`) plus a list of POIs with
coordinates and artworks. Artworks are either an image (URL + attribution) or
a text excerpt (excerpt + attribution). See `src/lib/types.ts`.
