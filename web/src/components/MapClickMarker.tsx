// components/MapClickMarker.tsx

"use client";

// 🔽 useMap をインポートに追加
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"; 
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- マーカーアイコン設定 (変更なし) ---
const CDN_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";
const iconDefault = L.icon({
    iconRetinaUrl: `${CDN_BASE}/marker-icon-2x.png`,
    iconUrl: `${CDN_BASE}/marker-icon.png`,
    shadowUrl: `${CDN_BASE}/marker-shadow.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
//L.Marker.prototype.options.icon = iconDefault;
//const DEFAULT_ICON = new L.Icon.Default();
// ---

export type MapClickMarkerProps = {
    onPositionChange?: (lat: number, lng: number) => void;
    currentPosition: LatLngTuple | null; 
    readOnly?: boolean;
    center?: LatLngTuple; 
};

// 🔽 外部から渡された center の変更を検知して地図を移動させるコンポーネント 🔽
function ChangeMapView({ center, zoom }: { center: LatLngTuple, zoom: number }) {
  const map = useMap(); 
  
  useEffect(() => {
    // flyToを使うことで、現在地や新しいピンの位置にスムーズに移動します
    map.flyTo(center, zoom);
  }, [center, zoom, map]);

  return null;
}
// 🔼 追加ここまで 🔼

/**
 * 内部コンポーネント: クリックイベントを処理
 */
// 🔽 --- ClickableMarker を修正 --- 🔽
function ClickableMarker({ onPositionChange, readOnly }: Pick<MapClickMarkerProps, 'onPositionChange' | 'readOnly'>) {
    
    useMapEvents({
        click(e) {
            if (readOnly || !onPositionChange) return; 

            const { lat, lng } = e.latlng;
            
            // 🔽 --- これが最重要 --- 🔽
            // ピンの位置を更新するために、親コンポーネント(post/page.tsx)の
            // handleMapPositionChange を呼び出す
            onPositionChange(lat, lng); 
            // 🔼 --- 修正ここまで --- 🔼

            // マップの中心を新しいピンの位置にアニメーションで移動
            e.target.flyTo(e.latlng, e.target.getZoom());
        },
    });

    // このコンポーネントはマーカーを描画する必要はない
    // マーカーは MapClickMarker が担当する
    return null;
}
// 🔼 --- 修正ここまで --- 🔼


/**
 * メインコンポーネント: 地図コンテナを描画
 */
export default function MapClickMarker({ 
    onPositionChange, 
    currentPosition, 
    readOnly = false,
    center 
}: MapClickMarkerProps) {
    
    const defaultCenter: LatLngTuple = useMemo(() => [35.681236, 139.767125], []);
    
    const mapCenter = center ?? (currentPosition ?? defaultCenter);
    const zoomLevel = readOnly ? 15 : 13;

    return (
        <MapContainer 
            center={mapCenter} 
            zoom={zoomLevel} 
            scrollWheelZoom={!readOnly}
            dragging={!readOnly}
            zoomControl={!readOnly}
            doubleClickZoom={!readOnly}
            touchZoom={!readOnly}
            style={{ height: '100%', width: '100%' }}
        >
            <ChangeMapView center={mapCenter} zoom={zoomLevel} />
            
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* 🔽 ClickableMarker を呼び出す (onPositionChange がある場合のみ) 🔽 */}
            {onPositionChange && (
                <ClickableMarker 
                    onPositionChange={onPositionChange} 
                    readOnly={readOnly}
                />
            )}
            
            {/* 🔽 マーカーの描画はここで行う 🔽 */}
            {currentPosition && (
                <Marker position={currentPosition} icon={iconDefault}>
                    <Popup>
                        {readOnly ? "イベント開催場所" : "場所を選択しました"}
                    </Popup>
                </Marker>
            )}
            {/* 🔼 --- 修正ここまで --- 🔼 */}
        </MapContainer>
    );
}