// src/app/api/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  // JWTクッキーを削除（空文字＋即時失効）
  const res = NextResponse.json({ ok: true, message: "ログアウトしました" });

  res.cookies.set("token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,         // 即時無効化
    expires: new Date(0),
  });

  return res;
}
