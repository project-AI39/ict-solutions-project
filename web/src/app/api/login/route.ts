// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "DEV_SECRET_KEY";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが間違っています" },
        { status: 401 }
      );
    }

    // JWT に必要情報を含める
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        points: user.points,
      },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Cookie に JWT をセットしてレスポンスを返す（1 回だけ）
    const res = NextResponse.json({
      token,
      username: user.username,
      points: user.points,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",      // Middleware で拾えるようにルート直下
      sameSite: "lax" // 開発環境では lax 推奨
      // secure: true  // HTTPS 本番のみ
    });

    return res;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// GETやPUTなどは受け付けない
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
