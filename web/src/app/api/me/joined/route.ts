// app/api/me/joined/route.ts
// 自分が参加したイベント一覧を返す API
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserIdFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // DB から自分が参加したイベントを取得（EventParticipant 経由）
    const joinedParticipations = await prisma.eventParticipant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            createdAt: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // event 部分だけを抽出して返す
    const joinedPosts = joinedParticipations.map((p) => p.event);

    return NextResponse.json(joinedPosts, { status: 200 });
  } catch (err) {
    console.error("GET /api/me/joined Error:", err);
    return NextResponse.json(
      { error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
