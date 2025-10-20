"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventCard } from "@/app/search/components/EventCard";
import { Box, Paper } from "@mui/material";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

const MiniMap = dynamic(() => import("@/app/search/components/MiniMap"), { ssr: false });
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

const navHeight = 64;

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [radius, setRadius] = useState(10);
  const [events, setEvents] = useState<any[]>([]);
  const [navValue, setNavValue] = useState(3);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);


  // ✅ 新規追加：日付検索用
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 現在地
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const mapCenter = [35.6895, 139.6917];

  const handleRadiusSelect = (r: number | null) => {
    if (r !== null && !handleCurrentLocation) {
      // 1回目だけ現在地取得許可ダイアログ
      getCurrentLocation();
      setHasAskedLocation(true);
    }
    setSelectedRadius(r);
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("このブラウザでは位置情報が取得できません。");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });

        // selectedRadius があればそれも検索条件に含める
        handleSearch({ lat: latitude, lng: longitude, radius: selectedRadius ?? undefined });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("現在地が取得できませんでした。位置情報を許可してください。");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("位置情報が利用できません。");
            break;
          case error.TIMEOUT:
            alert("位置情報の取得に時間がかかりすぎました。");
            break;
          default:
            alert("位置情報の取得で不明なエラーが発生しました。");
        }
      }
    );
  };

  const handleSearch = async (pos?: [number, number]) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          lat: pos?.[0] ?? 35.6895,
          lng: pos?.[1] ?? 139.6917,
          radius: selectedRadius ?? 999999,
          dateFrom, // ✅ 追加
          dateTo,   // ✅ 追加
        }),
      });
      if (!res.ok) throw new Error("検索に失敗しました");

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
      alert("検索エラーが発生しました");
    }
  };

  return (
<div className="flex flex-col h-screen">
  {/* --- 検索フォーム --- */}
  <form
    className="bg-white p-4 shadow-md flex flex-col gap-3 dark:text-gray-900"
    onSubmit={(e) => {
      e.preventDefault();
      handleSearch(currentPos || undefined);
    }}>

    {/* --- 1. イベント名検索 --- */}
    <div className="flex flex-col">
      <label className="text-sm mb-1">イベント名</label>
      <input
        type="text"
        className="border rounded p-2 dark:text-gray-900"
        placeholder="キーワードを入力"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
    </div>

    {/* --- 2. 距離検索（半径 + 現在地取得） --- */}
    <label className="text-sm">現在地からの範囲選択</label>
    <div className="flex gap-2 items-center">
      {/* 📍ボタンは左端固定 */}
      <button
        type="button"
        className="p-2 border rounded flex-shrink-0"
        onClick={handleCurrentLocation}
      >
        📍
      </button>

      {/* 半径ボタン群は横スクロール */}
      <div className="flex gap-2 flex-nowrap overflow-x-auto hide-scrollbar">
        <button
          className={`px-3 py-1 rounded border flex-shrink-0 ${
            selectedRadius === null ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700"
          }`}
          onClick={() => handleRadiusSelect(null)}
        >
          指定なし
        </button>
        {[5, 10, 20, 50].map((r) => (
          <button
            key={r}
            className={`px-3 py-1 rounded border flex-shrink-0 ${
              selectedRadius === r ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-700"
            }`}
            onClick={() => handleRadiusSelect(r)}
          >
            {r}km
          </button>
        ))}
      </div>
    </div>

    {/* --- 3. 日付検索 --- */}
    <label className="text-sm">開催日付</label>
    <div className="flex items-center gap-2">
      <input
        type="date"
        className="border rounded p-2 flex-1"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />
      <span>〜</span>
      <input
        type="date"
        className="border rounded p-2 flex-1"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
      />
    </div>

    {/* --- 4. 検索ボタン --- */}
    <button
      type="submit"
      className="p-2 bg-blue-500 text-white rounded w-full mt-2"
    >
      🔍 検索する
    </button>

  </form>

  {/* --- 地図と検索結果オーバーレイ --- */}
  <div className="relative flex-1">
    {/* 地図 */}
    <LeafletMap
      center={mapCenter}
      zoom={13}
      markers={events.map(ev => ({ id: ev.id, position: [ev.lat, ev.lng], title: ev.title }))}
      onClick={(latlng) => setMapCenter([latlng.lat, latlng.lng])}
      className="w-full h-full z-10"
    />

    {/* 地図から検索ボタン */}
    <button
      className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded z-20 dark:text-gray-900"
      onClick={() => handleSearch(mapCenter)}
    >
      地図から検索
    </button>

    {/* 検索結果オーバーレイ */}
    {events.length > 0 && (
      <div className="absolute inset-0 z-30 overflow-y-auto p-4" onClick={() => setEvents([])}>
        <div className="bg-white dark:text-gray-900 rounded-lg shadow-lg p-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              title={ev.title}
              distance={ev.distance}
              date={ev.date}
              lat={ev.lat}
              lng={ev.lng}
              description={ev.description}
            />
          ))}
        </div>
      </div>
    )}
    {/* Bottom navigation copied from Home for consistent UI */}
    <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
        <Paper elevation={8} sx={{ position: "relative", zIndex: 1200 }}>
            <BottomNavigation showLabels value={navValue} onChange={(e, v) => setNavValue(v)} sx={{ height: navHeight }}>
                <BottomNavigationAction component={Link} href="/" label="ホーム" icon={<HomeIcon />} />
                <BottomNavigationAction component={Link} href="/search" label="検索" icon={<SearchIcon />} />
                <BottomNavigationAction component={Link} href="/post" label="投稿" icon={<AddCircleOutlineIcon />} />
                <BottomNavigationAction component={Link} href="/user" label="ユーザー" icon={<PersonIcon />} />
                <BottomNavigationAction component={Link} href="/settings" label="設定" icon={<SettingsIcon />} />
            </BottomNavigation>
        </Paper>
    </Box>
  </div>
</div>

  );
}
