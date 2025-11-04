// src/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 安全に一部だけ見るヘルパ
function preview(v: unknown, len = 12) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (!s) return String(v);
  return s.length <= len ? s : `${s.slice(0, len)}…(${s.length})`;
}
function safeJson(v: unknown, max = 500) {
  try {
    const s = JSON.stringify(v);
    return s.length <= max ? s : s.slice(0, max) + "…(truncated)";
  } catch {
    return String(v);
  }
}

/** JWT or DEV_ASSUME_USER_ID から userId を取り出す（寛容化） */
function pickUserId(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value || null;

  const cookieNames = req.cookies.getAll().map((c) => c.name);
  console.log("[/api/me] cookies:", cookieNames, " token:", token ? preview(token) : "none");

  // 標準のヘルパを使う（sub クレーム対応済み）
  const uid = getUserIdFromRequest(req);
  if (uid) {
    console.log("[/api/me] getUserIdFromRequest -> uid:", uid);
    return uid;
  }

  // TEST-ONLY フォールバック
  if (process.env.DEV_ASSUME_USER_ID) {
    console.log("[/api/me] DEV_ASSUME_USER_ID fallback:", process.env.DEV_ASSUME_USER_ID);
    return process.env.DEV_ASSUME_USER_ID!;
  }

  console.log("[/api/me] No user identified.");
  return null;
}

/** GET /api/me : 現在ユーザーのポイント */
export async function GET(req: NextRequest) {
  const t0 = Date.now();
  try {
    console.log("[/api/me][GET] START", {
      NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE ?? null,
      DEV_ASSUME_USER_ID: process.env.DEV_ASSUME_USER_ID ?? null,
    });

    const userId = pickUserId(req);
    if (!userId) {
      console.warn("[/api/me][GET] Unauthorized: userId not resolved.");
      return NextResponse.json({ error: "未ログイン" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, points: true },
    });
    if (!user) {
      console.warn("[/api/me][GET] Not found:", userId);
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    console.log("[/api/me][GET] OK", {
      userId: user.id,
      username: user.username,
      points: user.points,
      elapsed_ms: Date.now() - t0,
    });

    const test = {
      DEV_ASSUME_USER_ID: process.env.DEV_ASSUME_USER_ID ?? null,
      NEXT_PUBLIC_TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE ?? null,
    };

    return NextResponse.json({ user, test });
  } catch (err) {
    console.error("[/api/me][GET] ERROR", {
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
      elapsed_ms: Date.now() - t0,
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

/** POST /api/me : 簡易ログイン（token クッキー発行／テスト専用） */
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const userId = (body?.userId as string) || "usr_1";

    console.log("[/api/me][POST] Issue token for:", userId);

    // 標準ヘルパでトークン発行
    const { signToken } = await import("@/lib/auth");
    const token = signToken(userId);

    const res = NextResponse.json({ ok: true, userId });
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    console.log("[/api/me][POST] Token issued", {
      token_preview: preview(token),
      elapsed_ms: Date.now() - t0,
    });

    return res;
  } catch (err) {
    console.error("[/api/me][POST] ERROR", {
      message: (err as Error)?.message,
      stack: (err as Error)?.stack,
      elapsed_ms: Date.now() - t0,
    });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
