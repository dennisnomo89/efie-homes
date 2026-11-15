"use client";

import dynamic from "next/dynamic";
import { MapPinned } from "lucide-react";

/* Leaflet needs the browser, so maps load on the client only, with a placeholder meanwhile. */

function MapSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-sand text-stone-400" aria-busy="true" aria-label="Loading map">
      <MapPinned className="h-8 w-8" />
    </div>
  );
}

export const ListingsMapLoader = dynamic(() => import("./ListingsMap"), { ssr: false, loading: MapSkeleton });
export const AreaMapLoader = dynamic(() => import("./AreaMap"), { ssr: false, loading: MapSkeleton });
export const LocationPickerLoader = dynamic(() => import("./LocationPicker"), { ssr: false, loading: MapSkeleton });
