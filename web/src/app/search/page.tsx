"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Box,
  Paper,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  BottomNavigation,
  BottomNavigationAction,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import { EventCard } from "@/app/search/components/EventCard";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });
const round4 = (num: number) => Math.round(num * 100) / 100;
const navHeight = 64;

export default function SearchPageMUI() {
  const [keyword, setKeyword] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [navValue, setNavValue] = useState(1);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6895, 139.6917]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleRadiusSelect = (r: number | null) => {
    if (r !== null && !handleCurrentLocation) {
      // 1回目だけ現在地取得許可ダイアログ
      getCurrentLocation();
      setHasAskedLocation(true);
    }
    setSelectedRadius(r);
  }

  const handleSearch = async (pos?: [number, number], selectedRadius) => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/searchs", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword, 
          lat: pos?.[0] ?? 35.6895, 
          lng: pos?.[1] ?? 139.6917, 
          radius: selectedRadius ?? 999999, 
          dateFrom, // ✅ 追加
          dateTo, // ✅ 追加 
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

  // フォームの変更で isSearching をリセット
  useEffect(() => {
    if (isSearching) {
      setIsSearching(false);
    }
  }, [keyword, dateFrom, dateTo]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* 検索フォーム */}
      <Paper sx={{ p: 2, mb: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="イベント名"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            fullWidth
          />

          {/* 現在地 + 半径選択 */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="outlined" onClick={handleCurrentLocation} sx={{ flexShrink: 0 }}>
              📍
            </Button>
            <Box
              sx={{
                overflowX: "auto",
                display: "flex",
                gap: 1,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none", // Firefox
              }}
            >
              <ToggleButtonGroup
                value={selectedRadius}
                exclusive
                onChange={(e, value) => {
                  handleRadiusSelect(value);
                  setIsSearching(true);
                  handleSearch(currentPos ?? mapCenter, value); // value に選択された半径を渡す
                }}
                sx={{ display: "flex", gap: 1 }}
              >
                <ToggleButton value={null} sx={{ flexShrink: 0 }}>
                  指定なし
                </ToggleButton>
                {[5, 10, 20, 50].map((r) => (
                  <ToggleButton key={r} value={r} sx={{ flexShrink: 0 }}>
                    {r} km
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* 日付選択 */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="開催日From"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                // dateTo が存在してかつ dateFrom が dateTo より後なら補正
                if (dateTo && new Date(e.target.value) > new Date(dateTo)) {
                  setDateTo(e.target.value); 
                }
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="開催日To"
              type="date"
              value={dateTo}
              onChange={(e) =>{
                setDateTo(e.target.value)
                // dateFrom が存在してかつ dateTo が dateFrom より前なら補正
                if (dateFrom && new Date(e.target.value) < new Date(dateFrom)) {
                  setDateFrom(e.target.value); 
                }
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            onClick={() => {
              if (isSearching) {
                setEvents([]);        // 検索結果を消す
                setIsSearching(false);
              } else {
                handleSearch(currentPos ?? mapCenter, selectedRadius);
              }
            }}
          >
            {isSearching ? "戻る" : "🔍 検索する"}
          </Button>
        </Box>
      </Paper>

      {/* 地図 + 検索結果オーバーレイ */}
      <Box sx={{ flex: 1, position: "relative", pb: `${navHeight}px` }}>
        <LeafletMap
          center={mapCenter}
          zoom={13}
          markers={events.map((ev) => ({ id: ev.id, position: [ev.latitude, ev.longitude], title: ev.title }))}
          onClick={(latlng) => setMapCenter([latlng.latitude, latlng.longitude])}
          className="w-full h-full z-10"
        />

        {isSearching && (
          <Box
            sx={{
              color: "grey.900",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: navHeight + 5,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              zIndex: 30,
              alignItems: "center",
              justifyContent: events.length === 0 ? "center" : "flex-start",
            }}
          >
            {events.length > 0 ? (
              events.map((ev) => (
                <EventCard
                  key={ev.id}
                  title={ev.title}
                  distance={ev.distance != null ? round4(ev.distance) : 0}
                  date={ev.createdAt ? new Date(ev.createdAt).toLocaleDateString("ja-JP") : "日付未定"}
                  lat={ev.latitude}
                  lng={ev.longitude}
                  description={ev.description}
                />
              ))
            ) : (
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: "#ffffff", // 白に変更
                  borderRadius: 2,
                  border: "2px dashed #FFEB3B", // 点線はそのまま黄色
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <span style={{ fontSize: 48 }}>😞</span>
                <Box sx={{ fontSize: 20, fontWeight: "bold" }}>検索結果がありません</Box>
                <Box sx={{ fontSize: 14, color: "text.secondary" }}>条件を変えて再度検索してください</Box>
              </Paper>
            )}
          </Box>
        )}

        {/* BottomNavigation */}
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <Paper elevation={8}>
            <BottomNavigation
              showLabels
              value={navValue}
              onChange={(e, newValue) => setNavValue(newValue)}
              sx={{ height: navHeight }}
            >
              <BottomNavigationAction component={Link} href="/" label="ホーム" icon={<HomeIcon />} />
              <BottomNavigationAction component={Link} href="/search" label="検索" icon={<SearchIcon />} />
              <BottomNavigationAction component={Link} href="/post" label="投稿" icon={<AddCircleOutlineIcon />} />
              <BottomNavigationAction component={Link} href="/user" label="ユーザー" icon={<PersonIcon />} />
              <BottomNavigationAction component={Link} href="/settings" label="設定" icon={<SettingsIcon />} />
            </BottomNavigation>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}