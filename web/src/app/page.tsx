"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { LatLngBounds } from "leaflet";

import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";

import { useDebounce } from "@/hooks/useDebounce";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

// イベントの型定義
type Event = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
};

// バウンディングボックスをキャッシュキーに変換する関数
// 小数点以下4桁で丸めて、近い範囲を同じキーとして扱う
function getBoundsKey(bounds: LatLngBounds): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const minLat = sw.lat.toFixed(4);
  const minLng = sw.lng.toFixed(4);
  const maxLat = ne.lat.toFixed(4);
  const maxLng = ne.lng.toFixed(4);

  return `${minLat},${minLng},${maxLat},${maxLng}`;
}

export default function Home() {
  const [value, setValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);

  // キャッシュ: Map<boundsKey, Event[]>
  const cacheRef = useRef<Map<string, Event[]>>(new Map());

  const navHeight = 64; // px
  const Tokyo: [number, number] = [35.6895, 139.6917];

  // デバウンス処理: 500ms後に実際のデータ取得を実行
  const debouncedBounds = useDebounce(currentBounds, 500);

  // APIからイベントを取得する関数(キャッシュ対応)
  const fetchEvents = useCallback(async (bounds: LatLngBounds) => {
    const boundsKey = getBoundsKey(bounds);

    // キャッシュチェック: 同じ範囲のデータが既にあれば再利用
    const cachedEvents = cacheRef.current.get(boundsKey);
    if (cachedEvents) {
      console.log("📦 Using cached data for bounds:", boundsKey);
      setEvents(cachedEvents);
      return;
    }

    setIsLoading(true);
    try {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const params = new URLSearchParams({
        minLat: sw.lat.toString(),
        minLng: sw.lng.toString(),
        maxLat: ne.lat.toString(),
        maxLng: ne.lng.toString(),
      });

      console.log("🌐 Fetching data from API for bounds:", boundsKey);
      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      const fetchedEvents = data.events || [];

      // キャッシュに保存(最大100件まで保持)
      if (cacheRef.current.size >= 100) {
        // 最も古いエントリを削除
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }
      cacheRef.current.set(boundsKey, fetchedEvents);

      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 地図の表示範囲が変更されたときのハンドラー
  // デバウンスのために、まずstateを更新するのみ
  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setCurrentBounds(bounds);
  }, []);

  // デバウンス後の範囲でデータ取得
  useEffect(() => {
    if (debouncedBounds) {
      fetchEvents(debouncedBounds);
    }
  }, [debouncedBounds, fetchEvents]);

  // イベントデータをマーカー形式に変換
  const markers = events.map((event) => ({
    id: event.id,
    position: [event.latitude, event.longitude] as [number, number],
    title: event.title,
    popup: (
      <div>
        <h3 style={{ margin: "0 0 8px 0" }}>{event.title}</h3>
        {event.description && <p style={{ margin: "0 0 8px 0" }}>{event.description}</p>}
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ maxWidth: "200px", width: "100%", borderRadius: "4px" }}
          />
        )}
      </div>
    ),
  }));
  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Map area: leave space for bottom nav so it isn't covered */}
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: `calc(100vh - ${navHeight}px)` }}>
        <LeafletMap
          center={Tokyo}
          zoom={13}
          markers={markers}
          onBoundsChange={handleBoundsChange}
        />
      </Box>

      {/* Bottom navigation - fixed to bottom, mobile-first */}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Paper elevation={8} sx={{ position: "relative", zIndex: 1200 }}>
          <BottomNavigation
            showLabels
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
            }}
            sx={{ height: navHeight }}
          >
            <BottomNavigationAction label="ホーム" icon={<HomeIcon />} />
            <BottomNavigationAction label="検索" icon={<SearchIcon />} />
            <BottomNavigationAction label="投稿" icon={<AddCircleOutlineIcon />} />
            <BottomNavigationAction label="ユーザー" icon={<PersonIcon />} />
            <BottomNavigationAction label="設定" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
