// src/app/api/me/use-points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/me/use-points : ポイントを使用する */
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    console.log("[/api/me/use-points][POST] START");

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      console.warn("[/api/me/use-points][POST] Unauthorized");
      return NextResponse.json({ error: "未ログイン" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const pointsToUse = parseInt(body?.points, 10);

    if (!pointsToUse || pointsToUse <= 0) {
      console.warn("[/api/me/use-points][POST] Invalid points:", body?.points);
      return NextResponse.json({ error: "無効なポイント数です" }, { status: 400 });
    }

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, points: true },
    });

    if (!user) {
      console.warn("[/api/me/use-points][POST] User not found:", userId);
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // ポイントが足りるか確認
    if (user.points < pointsToUse) {
      console.warn("[/api/me/use-points][POST] Insufficient points:", {
        current: user.points,
        requested: pointsToUse,
      });
      return NextResponse.json(
        { error: "ポイントが不足しています", currentPoints: user.points },
        { status: 400 }
      );
    }

    // ポイントを減らす
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { points: { decrement: pointsToUse } },
      select: { id: true, points: true },
    });

    console.log("[/api/me/use-points][POST] OK", {
      userId: updatedUser.id,
      usedPoints: pointsToUse,
      remainingPoints: updatedUser.points,
      elapsed_ms: Date.now() - t0,
    });

    return NextResponse.json({
      ok: true,
      usedPoints: pointsToUse,
      remainingPoints: updatedUser.points,
    });
  } catch (err) {
    console.error("[/api/me/use-points][POST] ERROR", {
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
      elapsed_ms: Date.now() - t0,
    });
    return NextResponse.json({ error: "内部エラー" }, { status: 500 });
  }
}
