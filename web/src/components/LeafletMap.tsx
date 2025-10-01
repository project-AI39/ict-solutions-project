"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import type { MapContainerProps } from "react-leaflet";
import L, { type LatLngTuple, type LatLngBoundsExpression, type IconOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons not showing in bundlers like Next.js
// by explicitly providing the icon asset URLs.
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl as unknown as string,
    iconUrl: iconUrl as unknown as string,
    shadowUrl: shadowUrl as unknown as string,
});

export type LeafletMarker = {
    id?: string | number;
    position: LatLngTuple;
    title?: string;
    popup?: ReactNode;
    iconOptions?: IconOptions; // custom icon if needed
};

type ExtraProps = {
    center: LatLngTuple;
    zoom?: number;
    className?: string;
    style?: CSSProperties;

    // Tile layer customization
    tileUrl?: string;
    attribution?: string;

    // Markers
    markers?: LeafletMarker[];
    onMarkerClick?: (marker: LeafletMarker) => void;

    // Fit map to markers bounds on mount/update
    fitBounds?: boolean;
    fitBoundsPadding?: [number, number];

    // Map click handler
    onMapClick?: (latlng: { lat: number; lng: number }) => void;
};

export type LeafletMapProps = Omit<MapContainerProps, "center" | "children"> & ExtraProps;

function FitBounds({ markers, padding }: { markers?: LeafletMarker[]; padding?: [number, number] }) {
    const map = useMap();
    if (!markers || markers.length === 0) return null;
    const bounds: LatLngBoundsExpression = markers.map((m) => m.position) as LatLngBoundsExpression;
    // useEffect to avoid calling before container is ready
    useEffect(() => {
        if (markers.length > 0) {
            map.fitBounds(bounds, { padding: padding ?? [24, 24] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(bounds)]);
    return null;
}

function MapClick({ onMapClick }: { onMapClick?: (latlng: { lat: number; lng: number }) => void }) {
    useMapEvents({
        click(e) {
            onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function LeafletMap({
    center,
    zoom = 13,
    className,
    style,
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution = "&copy; OpenStreetMap contributors",
    markers,
    onMarkerClick,
    fitBounds,
    fitBoundsPadding,
    onMapClick,
    ...mapProps
}: LeafletMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className={className}
            style={{ width: "100%", height: "100%", ...style }}
            {...mapProps}
        >
            <TileLayer url={tileUrl} attribution={attribution} />

            {fitBounds && <FitBounds markers={markers} padding={fitBoundsPadding} />}
            {onMapClick && <MapClick onMapClick={onMapClick} />}

            {markers?.map((m) => {
                const icon = m.iconOptions ? L.icon(m.iconOptions) : undefined;
                return (
                    <Marker key={m.id ?? `${m.position[0]}_${m.position[1]}`} position={m.position} title={m.title} icon={icon}
                        eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m) } : undefined}
                    >
                        {m.popup ? <Popup>{m.popup}</Popup> : null}
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
