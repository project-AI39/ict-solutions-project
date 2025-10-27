// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware でリダイレクトさせないパス
const PUBLIC_PATHS = [
  "/login",
  "/user_register",
  "/terms",
  "/favicon.ico",
  "/_next",        // Next.js 静的ファイル
  "/api"           // API ルート
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 静的ファイルや公開ページはスキップ
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Cookie から JWT を取得
  const token = req.cookies.get("token");

  // 未ログインなら /login にリダイレクト
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ログイン済みならそのままページを表示
  return NextResponse.next();
}
