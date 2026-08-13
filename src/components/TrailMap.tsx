import { Fragment, useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { LatLng, POI } from "../lib/types";

type Props = {
  path: LatLng[];
  pois: POI[];
  hiker: LatLng | null;
  activePoiId: string | null;
  proximityRadiusM: number;
  onPoiClick: (id: string) => void;
};

const hikerIcon = L.divIcon({
  className: "",
  html: '<div class="hiker-marker"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function poiIcon(active: boolean, index: number) {
  return L.divIcon({
    className: "",
    html: `<div class="poi-marker ${active ? "near" : ""}">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FollowHiker({ hiker }: { hiker: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (hiker) {
      map.panTo(hiker, { animate: true, duration: 0.5 });
    }
  }, [hiker, map]);
  return null;
}

export function TrailMap({
  path,
  pois,
  hiker,
  activePoiId,
  proximityRadiusM,
  onPoiClick,
}: Props) {
  const center: LatLng = path[Math.floor(path.length / 2)] ?? [37.75, -119.2];
  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://opentopomap.org/">OpenTopoMap</a>'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
      />
      <Polyline
        positions={path}
        pathOptions={{ color: "#1a1815", weight: 3, opacity: 0.9, dashArray: "6 4" }}
      />
      {pois.map((poi, i) => (
        <Fragment key={poi.id}>
          <CircleMarker
            center={poi.coord}
            radius={Math.max(6, proximityRadiusM / 80)}
            pathOptions={{
              color: "#1a1815",
              weight: 1,
              fillColor: "#1a1815",
              fillOpacity: 0.08,
            }}
          />
          <Marker
            position={poi.coord}
            icon={poiIcon(activePoiId === poi.id, i)}
            eventHandlers={{ click: () => onPoiClick(poi.id) }}
          />
        </Fragment>
      ))}
      {hiker && (
        <>
          <Marker position={hiker} icon={hikerIcon} />
          <FollowHiker hiker={hiker} />
        </>
      )}
    </MapContainer>
  );
}
