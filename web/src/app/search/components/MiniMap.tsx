//検索後に多くの条件を変更して再検索すると、エラーが出る。
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// SSR無効で読み込み
const MapContainer = dynamic(
  () => import("react-leaflet").then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(m => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then(m => m.Marker),
  { ssr: false }
);

export function MiniMap({ lat, lng }: { lat: number | null; lng: number | null }) {
  const [mounted, setMounted] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const prevPos = useRef<{ lat: number; lng: number } | null>(null);

  // 初回はクライアントでだけ描画
  useEffect(() => {
    setMounted(true);
    // 初回はすぐ表示
    setShowMap(true);
  }, []);

  // 座標が変わったら、一度非表示にして次フレームで再表示（完全再マウント）
  useEffect(() => {
    if (!mounted || lat == null || lng == null) return;
    const changed =
      !prevPos.current ||
      prevPos.current.lat !== lat ||
      prevPos.current.lng !== lng;

    if (changed) {
      prevPos.current = { lat, lng };
      setShowMap(false);
      const t = setTimeout(() => setShowMap(true), 1000); // 1ティック挟む
      return () => clearTimeout(t);
    }
  }, [lat, lng, mounted]);

  if (!mounted || lat == null || lng == null) return null;
  if (!showMap) return null; // ← ここで一度 “空振り” を挟むのがポイント

  return (
    <div style={{ width: "100%", height: 80, borderRadius: 8, overflow: "hidden" }}>
      <MapContainer
        key={`${lat}-${lng}`}           // 念のため MapContainer 自体も完全再生成
        center={[lat, lng]}
        zoom={15}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}
