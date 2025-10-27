import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/events
 * クエリパラメータ:
 *   - minLat: 最小緯度 (南西角の緯度)
 *   - minLng: 最小経度 (南西角の経度)
 *   - maxLat: 最大緯度 (北東角の緯度)
 *   - maxLng: 最大経度 (北東角の経度)
 *
 * 指定されたバウンディングボックス内のイベントを返します。
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minLat = searchParams.get("minLat");
    const minLng = searchParams.get("minLng");
    const maxLat = searchParams.get("maxLat");
    const maxLng = searchParams.get("maxLng");

    // パラメータのバリデーション
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return NextResponse.json(
        { error: "minLat, minLng, maxLat, maxLng are required" },
        { status: 400 }
      );
    }

    const minLatNum = parseFloat(minLat);
    const minLngNum = parseFloat(minLng);
    const maxLatNum = parseFloat(maxLat);
    const maxLngNum = parseFloat(maxLng);

    // 数値変換の確認
    if (
      isNaN(minLatNum) ||
      isNaN(minLngNum) ||
      isNaN(maxLatNum) ||
      isNaN(maxLngNum)
    ) {
      return NextResponse.json(
        { error: "Invalid coordinate values" },
        { status: 400 }
      );
    }

    // バウンディングボックス内のイベントを取得
    // latitude が minLat と maxLat の間、longitude が minLng と maxLng の間
    const events = await prisma.event.findMany({
      where: {
        latitude: {
          gte: minLatNum,
          lte: maxLatNum,
        },
        longitude: {
          gte: minLngNum,
          lte: maxLngNum,
        },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        description: true,
        createdAt: true,
      },
      // パフォーマンス対策: 大量のデータを防ぐため上限を設定
      take: 500,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
