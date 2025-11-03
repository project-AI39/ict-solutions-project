//web\src\app\api\searchs\route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const {
    keyword,
    lat,
    lng,
    radius,
    dateFrom,
    dateTo,
    sort,     // ← UIと合わせる
  } = await req.json();

  // ============
  // 日付フィルタ
  // ============
  const eventFilter: any = {};

  if (dateFrom && dateTo) {
    eventFilter.AND = [
      { eventfinishDay: { gte: new Date(dateFrom) } },
      { eventstartDay: { lte: new Date(dateTo) } },
    ];
  } else if (dateFrom) {
    eventFilter.eventfinishDay = { gte: new Date(dateFrom) };
  } else if (dateTo) {
    eventFilter.eventstartDay = { lte: new Date(dateTo) };
  }

  // ==============
  // DB取得
  // ==============
  const events = await prisma.event.findMany({
    where: {
      title: { contains: keyword || "", mode: "insensitive" },
      ...eventFilter,
    },
  });

  // ==============
  // 距離計算
  // ==============
  const results = events
    .map(ev => ({
      ...ev,
      distance:
        lat != null && lng != null
          ? Math.sqrt(
            Math.pow(ev.latitude - lat, 2) +
            Math.pow(ev.longitude - lng, 2)
          ) * 111
          : null,
    }))
    .filter(ev => !radius || !ev.distance || ev.distance <= radius);

  // ==============
  // ソート
  // ==============
  if (sort === "distance") {
    // ✅ 距離が近い順
    results.sort((a, b) => {
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  } else if (sort === "time") {
    // ✅ 開催が近い順
    results.sort(
      (a, b) =>
        new Date(a.eventstartDay).getTime() -
        new Date(b.eventstartDay).getTime()
    );

  } else if (sort === "new") {
    // ✅ 新着順
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  } else {
    // ✅ デフォルト
    results.sort(
      (a, b) =>
        new Date(a.eventstartDay).getTime() -
        new Date(b.eventstartDay).getTime()
    );
  }

  return NextResponse.json(results);
}
