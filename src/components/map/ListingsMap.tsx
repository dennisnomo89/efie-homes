"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { propertyTypeLabel, REGION_CENTERS } from "@/lib/constants";
import type { MapPin } from "@/lib/properties";
import { SafeImage } from "../ui/SafeImage";
import { formatCedis, formatCedisCompact } from "@/lib/utils";

export const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ACCRA = REGION_CENTERS["Greater Accra"]!;

function priceIcon(pin: MapPin) {
  return L.divIcon({
    className: "", // drop Leaflet's default white box
    html: `<span class="efie-price-pin">${formatCedisCompact(pin.monthlyRent)}</span>`,
    iconSize: [56, 32], // a real hit area for taps; the pill may be wider and overflows visibly
    iconAnchor: [28, 32],
    popupAnchor: [0, -28],
  });
}

/** Zooms the map to fit all pins whenever the set of pins changes. */
function FitToPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  const key = pins.map((p) => p.id).join(",");
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 15);
      return;
    }
    map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function ListingsMap({ pins }: { pins: MapPin[] }) {
  const icons = useMemo(() => new Map(pins.map((p) => [p.id, priceIcon(p)])), [pins]);

  return (
    <MapContainer center={ACCRA} zoom={11} scrollWheelZoom className="h-full w-full" aria-label="Map of matching homes">
      <TileLayer url={OSM_TILES} attribution={OSM_ATTRIBUTION} maxZoom={19} />
      <FitToPins pins={pins} />
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={icons.get(p.id)!} title={`${formatCedis(p.monthlyRent)} — ${p.title}`}>
          <Popup minWidth={220} maxWidth={260}>
            <Link href={`/properties/${p.id}`} className="block w-[220px] text-ink no-underline">
              {p.image && (
                <SafeImage src={p.image} alt="" sizes="220px" className="mb-2 h-28 w-full rounded-lg object-cover" />
              )}
              <span className="block font-display text-base font-semibold text-forest-800">{formatCedis(p.monthlyRent)} / month</span>
              <span className="mt-0.5 line-clamp-2 block text-sm font-semibold leading-snug">{p.title}</span>
              <span className="mt-1 block text-xs text-stone-500">
                {propertyTypeLabel(p.propertyType)} · {p.neighborhood}
              </span>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
