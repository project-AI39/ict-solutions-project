"use client";

import type { CSSProperties } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  center: [number, number];
  zoom?: number;
  className?: string;
  style?: CSSProperties;
};

export default function LeafletMap({ center, zoom = 13, className, style }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} style={{ width: "100%", height: "100%", ...style }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
    </MapContainer>
  );
}
