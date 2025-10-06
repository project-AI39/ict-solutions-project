"use client";

import type { CSSProperties, ReactNode } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { MapContainerProps } from "react-leaflet";
import type { LatLngTuple, IconOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

// CDN 経由でアイコン画像を参照する（バンドル依存を避ける）
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
