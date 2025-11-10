//検索後に多くの条件を変更して再検索すると、エラーが出る。
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { keyword, lat, lng, radius, dateFrom, dateTo, sort, hidePast } = await req.json();   // ✅ add

  // --------------------------
  // 🔍 条件生成
  // --------------------------
  type EventFilter = {
    AND?: Array<Record<string, unknown>>;
    eventfinishDay?: { gte: Date };
    eventstartDay?: { lte: Date };
  };
  
  const eventFilter: EventFilter = {};

  // ✅ 開催期間フィルタ
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

  // ✅ 終了イベントを除外（「今日より前で終わっているイベント」を弾く）
  if (hidePast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    eventFilter.AND = [
      ...(eventFilter.AND ?? []),
      { eventfinishDay: { gte: today } },
    ];
  }

  // --------------------------
  // 🔍 DB検索
  // --------------------------
  const events = await prisma.event.findMany({
    where: {
      title: { contains: keyword || "", mode: "insensitive" },
      ...eventFilter,
    },
  });

  // --------------------------
  // 📏 距離計算
  // --------------------------
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


  // --------------------------
  // 🔃 並び替え
  // --------------------------
  if (sort === "distance") {
    results.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  } else if (sort === "time") {
    results.sort(
      (a, b) =>
        new Date(a.eventstartDay).getTime() -
        new Date(b.eventstartDay).getTime()
    );
  } else if (sort === "new") {
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }

  return NextResponse.json(results);
}
