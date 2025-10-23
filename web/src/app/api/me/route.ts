// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY"; // 秘密鍵

type User = { userId: string; username: string; points: number };

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Cookie から JWT を取得
    const cookies = cookie.parse(req.headers.get("cookie") || "");
    const token = cookies["token"];
    if (!token) return NextResponse.json({ error: "未ログイン" }, { status: 401 });

    // 2️⃣ JWT を検証
    const payload = jwt.verify(token, JWT_SECRET) as User;

    // 3️⃣ 成功 → ユーザ情報を返す
    return NextResponse.json({ user: payload });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "無効なトークン" }, { status: 401 });
  }
}
