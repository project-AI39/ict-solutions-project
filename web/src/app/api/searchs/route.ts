// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { keyword, lat, lng, radius, dateFrom, dateTo } = await req.json();

  // 日付範囲フィルター
  const dateFilter: any = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo)   dateFilter.lte = new Date(dateTo);

  // イベント検索
  const events = await prisma.event.findMany({
    where: {
      title: { contains: keyword || "", mode: "insensitive" },
      ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}),  // ← 修正！
    },
  });

  // 距離フィルター（PostGIS 未使用の場合、フロント式の近似計算）
  const results = events
    .map(ev => ({
      ...ev,
      distance: Math.sqrt(Math.pow(ev.latitude - lat, 2) + Math.pow(ev.longitude - lng, 2)) * 111,
    }))
    .filter(ev => radius == null || ev.distance <= radius);

  // 日付順にソート
  results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); 
  // 距離順にソート（昇順）
//  results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return NextResponse.json(results);
}
