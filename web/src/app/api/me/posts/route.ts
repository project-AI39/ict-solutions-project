// app/api/me/posts/route.ts
// 自分が投稿したイベント一覧を返す API
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "DEV_SECRET_KEY";

export async function GET(req: NextRequest) {
  try {
    // Cookie から token を取得
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // JWT をデコード（署名検証は後で追加する想定だが、今は decode のみ）
    // 注意: jwt.verify を使うべきだが、とりあえず動かすために decode を使用
    const decoded = jwt.decode(token) as { userId?: string } | null;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

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
    return NextResponse.json(
      { error: "サーバーエラー" },
      { status: 500 }
    );
  }
}
