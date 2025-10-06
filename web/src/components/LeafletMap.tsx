"use client";

import type { CSSProperties, ReactNode } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { MapContainerProps } from "react-leaflet";
import type { LatLngTuple, IconOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

// CDN 経由でアイコン画像を参照する（バンドル依存を避ける）
import L from "leaflet";
