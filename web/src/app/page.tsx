"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { LatLngBounds } from "leaflet";

import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Link from "next/link";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import MyLocationIcon from "@mui/icons-material/MyLocation";

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

// 定数を関数外で定義
const Tokyo: [number, number] = [35.6895, 139.6917];

export default function Home() {
  const [value, setValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);

  // キャッシュ: Map<boundsKey, Event[]>
  const cacheRef = useRef<Map<string, Event[]>>(new Map());
  const router = useRouter();

  const navHeight = 64; // px
  const headerHeight = 72; // px
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(Tokyo);
  const [locating, setLocating] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);

  // デバウンス処理: 500ms後に実際のデータ取得を実行
  const debouncedBounds = useDebounce(currentBounds, 500);

  // ブラウザの Geolocation API で現在地を取得
  useEffect(() => {
    if (!navigator || !navigator.geolocation) {
      // Geolocation 非対応
      setInitialCenter(Tokyo);
      return;
    }

    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setInitialCenter([lat, lng]);
      },
      (err) => {
        console.warn("Geolocation error, falling back to Tokyo:", err);
        if (mounted) setInitialCenter(Tokyo);
      },
      { enableHighAccuracy: true, maximumAge: 1000 * 60 * 5, timeout: 10000 }
    );

    return () => {
      mounted = false;
    };
  }, []);

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

  // ユーザーの現在地に地図を移動するハンドラー
  const handleLocateClick = useCallback(() => {
    if (!navigator || !navigator.geolocation) {
      alert("お使いのブラウザは位置情報に対応していません。");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setInitialCenter([lat, lng]);
        setLocating(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("位置情報の取得に失敗しました。許可設定や端末の位置情報を確認してください。");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // 現在のユーザー情報（ポイント）を取得
  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      setPointsLoading(true);
      try {
        const res = await fetch('/api/me');
        if (!res.ok) {
          // 未ログイン等 → ログインページへリダイレクト
          if (mounted) {
            setPoints(null);
            try {
              router.push('/login');
            } catch (e) {
              console.error('Redirect to /login failed', e);
            }
          }
          return;
        }
        const data = await res.json();
        if (mounted && data?.user?.points != null) {
          setPoints(data.user.points);
        }
      } catch (err) {
        console.error('Failed to fetch /api/me', err);
        if (mounted) setPoints(null);
      } finally {
        if (mounted) setPointsLoading(false);
      }
    }
    fetchMe();
    return () => {
      mounted = false;
    };
  }, [router]);

  // デバウンス後の範囲でデータ取得
  useEffect(() => {
    if (debouncedBounds) {
      fetchEvents(debouncedBounds);
    }
  }, [debouncedBounds, fetchEvents]);

  // イベントデータをマーカー形式に変換
  // markers の生成部分
  const markers = events.map((event) => ({
    id: event.id,
    position: [event.latitude, event.longitude] as [number, number],
    title: event.title,
    popup: (
      <div style={{ maxWidth: 220 }}>
        <h3 style={{ margin: "0 0 8px 0" }}>{event.title}</h3>
        {event.description && (
          <p style={{ margin: "0 0 8px 0" }}>{event.description}</p>
        )}
        {event.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={event.title}
            style={{ maxWidth: "200px", width: "100%", borderRadius: 4, marginBottom: 8 }}
          />
        )}
        <a href={`/events/${event.id}`} style={{ textDecoration: "underline" }}>
          詳細を見る →
        </a>
      </div>
    ),
  }));

  return (
    <Box sx={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", bgcolor: "grey.100" }}>
      {/* Header ad area */}
      <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: `${headerHeight}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "grey",
        zIndex: 1300,
      }}
      >
      <span style={{ fontWeight: 600 }}>広告スペース</span>
      </Box>

      {/* Map area */}
      <Box sx={{ position: "absolute", top: `${headerHeight}px`, left: 0, right: 0, height: `calc(100vh - ${navHeight}px - ${headerHeight}px)` }}>
        {/* 右上に現在地ボタンを重ねる */}
        <IconButton
          onClick={handleLocateClick}
          disabled={locating}
          size="large"
          sx={{
        position: "absolute",
        top: 12,
        right: 12,
        bgcolor: "background.paper",
        boxShadow: 3,
        zIndex: 1400,
        ":hover": { bgcolor: "background.paper" },
          }}
          aria-label="現在地に移動"
        >
          <MyLocationIcon sx={{ color: "#1976d2" }} />
        </IconButton>

        {/* 左下にポイント表示オーバーレイ */}
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 1400,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {pointsLoading ? (
              <CircularProgress size={36} />
            ) : points != null ? (
              <Typography
                variant="h4"
                sx={{ fontWeight: 500, fontSize: "1.8rem", lineHeight: 1, color: "primary.main" }}
              >
                {`${points}pt`}
              </Typography>
            ) : (
              <Typography variant="body2" />
            )}
          </Stack>
        </Paper>

        <LeafletMap
          center={initialCenter ?? Tokyo}
          zoom={13}
          markers={markers}
          onBoundsChange={handleBoundsChange}
        />
      </Box>

      {/* Bottom navigation */}
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
            <BottomNavigationAction component={Link} href="/" label="ホーム" icon={<HomeIcon />} />
            <BottomNavigationAction component={Link} href="/search" label="検索" icon={<SearchIcon />} />
            <BottomNavigationAction component={Link} href="/post" label="投稿" icon={<AddCircleOutlineIcon />} />
            <BottomNavigationAction component={Link} href="/user" label="ユーザー" icon={<PersonIcon />} />
            <BottomNavigationAction component={Link} href="/settings" label="設定" icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </Box>
  );
}
