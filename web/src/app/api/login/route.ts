// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "DEV_SECRET_KEY";

// true でハッシュ前提運用
const HASH_ENABLED = (process.env.PASSWORD_HASH_ENABLED ?? "true").toLowerCase() === "true";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    // ユーザーが存在しない場合
    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが間違っています" },
        { status: 401 }
      );
    }

    // 保存値が bcrypt っぽいかを判定（$2a/$2b/$2y）
    const looksHashed =
      typeof user.password === "string" && /^\$2[aby]\$/.test(user.password);

    // 平文 or ハッシュで照合を切替
    let ok = false;
    if (looksHashed || HASH_ENABLED) {
      ok = await bcrypt.compare(password, user.password);
    } else {
      ok = user.password === password;
    }

    if (!ok) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが間違っています" },
        { status: 401 }
      );
    }

    // 平文 → ハッシュへの自動移行
    if (HASH_ENABLED && !looksHashed) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
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

    // Cookie に JWT をセットしてレスポンスを返す
    const res = NextResponse.json({
      token,
      username: user.username,
      points: user.points,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      // secure: true // 本番のみ
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
