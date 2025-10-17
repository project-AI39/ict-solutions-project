"use client";

import type { CSSProperties, ReactNode } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import type { MapContainerProps } from "react-leaflet";
import type { LatLngTuple, IconOptions, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

// CDN 経由でアイコン画像を参照する(バンドル依存を避ける)
import L from "leaflet";

const CDN_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";
L.Icon.Default.mergeOptions({
    iconRetinaUrl: `${CDN_BASE}/marker-icon-2x.png`,
    iconUrl: `${CDN_BASE}/marker-icon.png`,
    shadowUrl: `${CDN_BASE}/marker-shadow.png`,
});

// 明示的にデフォルトアイコンインスタンスを作成しておく。
// 一部のバンドラ環境だと prototype の参照が壊れる場合があるため、
// Marker に対して明示的に同じインスタンスを渡して安定表示させます。
const DEFAULT_ICON = new L.Icon.Default();

type ExtraProps = {
    center: LatLngTuple;
    zoom?: number;
    className?: string;
    style?: CSSProperties;
    tileUrl?: string;
    attribution?: string;
    // Marker support
    markers?: LeafletMarker[];
    // 地図の表示範囲が変更された際のコールバック
    onBoundsChange?: (bounds: LatLngBounds) => void;
};

export type LeafletMarker = {
    id?: string | number;
    position: LatLngTuple;
    title?: string;
    popup?: ReactNode;
    iconOptions?: IconOptions;
};

export type LeafletMapProps = Omit<MapContainerProps, "center" | "children"> & ExtraProps;

// 地図イベントをハンドリングするコンポーネント
function MapEventHandler({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
    useMapEvents({
        moveend: (e) => {
            if (onBoundsChange) {
                const bounds = e.target.getBounds();
                onBoundsChange(bounds);
            }
        },
        zoomend: (e) => {
            if (onBoundsChange) {
                const bounds = e.target.getBounds();
                onBoundsChange(bounds);
            }
        },
    });
    return null;
}

function MarkerList({ markers }: { markers?: LeafletMarker[] }) {
    if (!markers || markers.length === 0) return null;

    return (
        <>
            {markers.map((m) => {
                if (!Array.isArray(m.position) || m.position.length !== 2) return null;
                const key = m.id ?? `${m.position[0]}_${m.position[1]}`;
                return (
                    <Marker key={key} position={m.position} title={m.title} icon={DEFAULT_ICON}>
                        {m.popup ? <Popup>{m.popup}</Popup> : null}
                    </Marker>
                );
            })}
        </>
    );
}
export default function LeafletMap({ center, zoom = 13, className, style, tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution = "&copy; OpenStreetMap contributors", markers, onBoundsChange, ...mapProps }: LeafletMapProps) {
    return (
        <MapContainer center={center} zoom={zoom} className={className} style={{ width: "100%", height: "100%", ...style }} {...mapProps}>
            <TileLayer url={tileUrl} attribution={attribution} />
            <MapEventHandler onBoundsChange={onBoundsChange} />
            <MarkerList markers={markers} />
        </MapContainer>
    );
}
