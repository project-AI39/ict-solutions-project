// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";

function getUserId(req: NextRequest): string | null {
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const token = cookies["token"];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid?: string; userId?: string };
    // あなたのJWTペイロードは /api/me で { userId, username, points } を返しているので userId を優先
    return (payload.userId || payload.uid) ?? null;
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest) {
  const uid = getUserId(req);
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { username } = await req.json().catch(() => ({}));
  const name = String(username ?? "").trim();

  // フロントと同等の軽いバリデーション
  if (!name || name.length < 3 || name.length > 20) {
    return NextResponse.json({ message: "Invalid username" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_ぁ-んァ-ヶｦ-ﾟ一-龥ー]+$/.test(name)) {
    return NextResponse.json({ message: "Invalid characters" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: uid },
      data: { username: name },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Prisma 一意制約
    if (e?.code === "P2002") {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 });
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const uid = getUserId(req);
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // TODO: 関連データの削除が必要ならここで実施
  await prisma.user.delete({ where: { id: uid } });

  const res = NextResponse.json({ ok: true });
  // セッションクッキー破棄
  res.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
