// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { keyword, lat, lng, radius } = await req.json();

  const allEvents = [
    { id: 1, title: "渋谷フェス", lat: 35.659, lng: 139.703, date: "2025-11-03", description: "楽しい音楽イベントです。" },
    { id: 2, title: "上野マルシェ", lat: 35.712, lng: 139.774, date: "2025-11-05", description: "地元野菜が集まるマーケット" },
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
