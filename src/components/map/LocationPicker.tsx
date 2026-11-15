"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { OSM_ATTRIBUTION, OSM_TILES } from "./ListingsMap";

export type LatLng = { lat: number; lng: number };

const pinIcon = L.divIcon({
  className: "",
  html: '<span class="efie-pick-pin" aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

function ClickToPlace({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: round6(e.latlng.lat), lng: round6(e.latlng.lng) });
    },
  });
  return null;
}

/** Moves the map to the neighbourhood when it changes, as long as no pin has been placed yet. */
function FollowCenter({ center, hasPin }: { center: [number, number]; hasPin: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!hasPin) map.setView(center, 14);
  }, [center[0], center[1], hasPin, map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  center,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  center: [number, number];
}) {
  const start = useMemo<[number, number]>(() => (value ? [value.lat, value.lng] : center), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapContainer center={start} zoom={value ? 16 : 14} scrollWheelZoom className="h-full w-full" aria-label="Map: tap to place the property pin">
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <ClickToPlace onPick={onChange} />
      <FollowCenter center={center} hasPin={Boolean(value)} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const p = (e.target as L.Marker).getLatLng();
              onChange({ lat: round6(p.lat), lng: round6(p.lng) });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
