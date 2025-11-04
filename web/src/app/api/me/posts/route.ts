// app/api/me/posts/route.ts
// 自分が投稿したイベント一覧を返す API
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

    // DB から自分が投稿したイベントを取得
    const myPosts = await prisma.event.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json(myPosts, { status: 200 });
  } catch (err) {
    console.error("GET /api/me/posts Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
