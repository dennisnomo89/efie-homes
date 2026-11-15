"use client";

import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, TileLayer } from "react-leaflet";
import { OSM_ATTRIBUTION, OSM_TILES } from "./ListingsMap";

/** Shows the approximate area of a home (a ~300 m circle), never the exact house. */
export default function AreaMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full" aria-label="Approximate location map">
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <Circle center={[lat, lng]} radius={300} pathOptions={{ color: "#174e3c", weight: 2, fillColor: "#2d9870", fillOpacity: 0.18 }} />
    </MapContainer>
  );
}
