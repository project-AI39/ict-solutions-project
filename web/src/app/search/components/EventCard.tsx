//検索後に多くの条件を変更して再検索すると、エラーが出る。
"use client";
import dynamic from "next/dynamic";
import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

// ✅ MiniMap を SSR 無効で動的読み込み（サーバーに載せない）
const MiniMap = dynamic(() => import("./MiniMap").then(m => m.MiniMap), {
  ssr: false,
});

// 型定義を追加
interface EventCardProps {
  id: string;
  title: string;
  distance: number;
  sdate: string | Date;
  fdate: string | Date;
  lat: number | null;
  lng: number | null;
  description?: string | null;
}

export function EventCard({ id, title, distance, sdate, fdate, lat, lng }: EventCardProps) {

  const jpStart = new Date(sdate).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  const jpEnd = new Date(fdate).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const jpDate = jpStart === jpEnd ? jpStart : `${jpStart}〜${jpEnd}`;

  // ✅ Googleマップで経路を開く（destinationだけ渡す簡易版）
  const openRouteInGoogleMap = () => {
    if (lat == null || lng == null) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
    // 新しいタブで開く
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: 2,
        border: "1px solid #ddd",
        p: 2,
        mb: 2,
        backgroundColor: "#fff",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
        距離：{distance}km　｜　開催日：{jpDate}
      </Typography>

      <MiniMap key={`mini-${id}-${lat}-${lng}`} lat={lat} lng={lng} />

      {/* ✅ ボタンを横並びに（左：詳細を見る、右：ここに行く） */}
      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          component={Link}
          href={`/events/${id}`}
          sx={{ textDecoration: "none", flex: 1 }}
        >
          詳細を見る ▶
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={openRouteInGoogleMap}
          sx={{ flex: 1 }}
        >
          ここに行く🧭
        </Button>
      </Box>
    </Box>
  );
}
