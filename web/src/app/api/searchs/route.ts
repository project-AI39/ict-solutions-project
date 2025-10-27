import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { keyword, lat, lng, radius, dateFrom, dateTo } = await req.json();

  // 日付フィルター
  const eventFilter: any = {};

  // dateFrom/dateTo が指定されている場合，期間が重なるイベントを抽出
  if (dateFrom && dateTo) {
    eventFilter.AND = [
      { eventfinishDay: { gte: new Date(dateFrom) } }, // 終了が検索開始以降
      { eventstartDay: { lte: new Date(dateTo) } },    // 開始が検索終了以前
    ];
  } else if (dateFrom) {
    eventFilter.eventfinishDay = { gte: new Date(dateFrom) };
  } else if (dateTo) {
    eventFilter.eventstartDay = { lte: new Date(dateTo) };
  }

  // イベント検索
  const events = await prisma.event.findMany({
    where: {
      title: { contains: keyword || "", mode: "insensitive" },
      ...eventFilter,
    },
  });

  // 距離フィルター（PostGIS 未使用の場合の簡易距離計算）
  const results = events
    .map(ev => ({
      ...ev,
      distance:
        lat != null && lng != null
          ? Math.sqrt(
              Math.pow(ev.latitude - lat, 2) + Math.pow(ev.longitude - lng, 2)
            ) * 111 // 約1度 ≒ 111km
          : null,
    }))
    .filter(ev => radius == null || ev.distance == null || ev.distance <= radius);

  // ソート：開始日の早い順
  results.sort(
    (a, b) =>
      new Date(a.eventstartDay).getTime() - new Date(b.eventstartDay).getTime()
  );

  return NextResponse.json(results);
}
