"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- マーカーアイコン設定 (変更なし) ---
const CDN_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";
L.Icon.Default.mergeOptions({
    iconRetinaUrl: `${CDN_BASE}/marker-icon-2x.png`,
    iconUrl: `${CDN_BASE}/marker-icon.png`,
    shadowUrl: `${CDN_BASE}/marker-shadow.png`,
});
const DEFAULT_ICON = new L.Icon.Default();
// ---

// Propsの型定義を修正
export type MapClickMarkerProps = {
    onPositionChange?: (lat: number, lng: number) => void; // 👈 任意に変更
    currentPosition: LatLngTuple | null; 
    readOnly?: boolean; // 👈 読み取り専用フラグを追加
    center?: LatLngTuple; // 👈 プレビュー用に中心座標を受け取れるようにする
};

/**
 * 内部コンポーネント: クリックイベントを処理
 */
function ClickableMarker({ onPositionChange, currentPosition, readOnly }: Omit<MapClickMarkerProps, 'center'>) {
    const position = currentPosition;

    useMapEvents({
        click(e) {
            // 読み取り専用時、またはコールバックが無い場合は何もしない
            if (readOnly || !onPositionChange) return; 

            const { lat, lng } = e.latlng;
            console.log("👉 [MapClickMarker] Map Clicked! New Position:", lat, lng);
            onPositionChange(lat, lng); 
            e.target.flyTo(e.latlng, e.target.getZoom());
        },
    });

    if (position === null) {
        return null;
    }

    // 座標が設定されていればマーカーを表示
    return (
        <Marker position={position} icon={DEFAULT_ICON}>
            <Popup>
                {readOnly ? "イベント開催場所" : "場所を選択しました"}
            </Popup>
        </Marker>
    );
}

/**
 * メインコンポーネント: 地図コンテナを描画
 */
export default function MapClickMarker({ 
    onPositionChange, 
    currentPosition, 
    readOnly = false, // デフォルトはfalse
    center 
}: MapClickMarkerProps) {
    
    const defaultCenter: LatLngTuple = useMemo(() => [35.681236, 139.767125], []);
    
    // プレビュー時は指定されたcenterかピンの位置を中央に、それ以外はデフォルト位置
    const mapCenter = center ?? (currentPosition ?? defaultCenter);

    return (
        <MapContainer 
            center={mapCenter} 
            zoom={readOnly ? 15 : 13} // プレビュー時は少しズーム
            // 読み取り専用時はすべての操作を無効化
            scrollWheelZoom={!readOnly}
            dragging={!readOnly}
            zoomControl={!readOnly}
            doubleClickZoom={!readOnly}
            touchZoom={!readOnly}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickableMarker 
                onPositionChange={onPositionChange} 
                currentPosition={currentPosition} 
                readOnly={readOnly}
            />
        </MapContainer>
    );
}