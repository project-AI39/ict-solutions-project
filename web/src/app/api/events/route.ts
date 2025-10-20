// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { keyword, lat, lng, radius } = await req.json();

  const allEvents = [
    { id: 1, title: "渋谷フェス", lat: 35.659, lng: 139.703, date: "2025-11-03", description: "楽しい音楽イベントです。" },
    { id: 2, title: "上野マルシェ", lat: 35.712, lng: 139.774, date: "2025-11-05", description: "地元野菜が集まるマーケット" },
    { id: 3, title: "新宿アートフェア", lat: 35.693, lng: 139.703, date: "2025-11-06", description: "最新のアート作品を展示。" },
    { id: 4, title: "池袋ナイトマーケット", lat: 35.728, lng: 139.710, date: "2025-11-07", description: "夜市で珍しいグルメを楽しもう。" },
    { id: 5, title: "丸の内ランニングフェス", lat: 35.681, lng: 139.767, date: "2025-11-08", description: "健康志向のランイベントです。" },
    { id: 6, title: "浅草文化祭", lat: 35.714, lng: 139.796, date: "2025-11-09", description: "伝統文化とグルメを楽しむ祭り。" },
    { id: 7, title: "六本木ヒルズイルミネーション", lat: 35.660, lng: 139.729, date: "2025-11-10", description: "冬の夜を彩るライトアップイベント。" },
    { id: 8, title: "お台場海辺フェス", lat: 35.627, lng: 139.776, date: "2025-11-11", description: "海辺で楽しむ音楽とフードのフェス。" },
    { id: 9, title: "東京タワー夜景ツアー", lat: 35.658, lng: 139.745, date: "2025-11-12", description: "夜景スポット巡りツアーです。" },
    { id: 10, title: "銀座ショッピングマラソン", lat: 35.671, lng: 139.765, date: "2025-11-13", description: "限定商品を探しながら街歩き。" },
    { id: 11, title: "上野動物園ピクニック", lat: 35.715, lng: 139.774, date: "2025-11-14", description: "動物を見ながらピクニックを楽しもう。" },
    { id: 12, title: "表参道ファッションウィーク", lat: 35.667, lng: 139.706, date: "2025-11-15", description: "最新トレンドのファッションイベント。" },
  ];


  const filtered = allEvents.filter(ev => ev.title.includes(keyword));
  const results = filtered
    .map(ev => ({
      ...ev,
      distance: Math.sqrt(Math.pow(ev.lat - lat, 2) + Math.pow(ev.lng - lng, 2)) * 111,
    }))
    .filter(ev => ev.distance <= radius);

  return NextResponse.json(results);
}
