// src/app/api/users/change-password/route.ts
//いったん平文のままパスワードを扱っている。 将来的にハッシュ化を検討。
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";

// CookieからユーザーIDを取得
function getUserId(req: NextRequest): string | null {
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const token = cookies["token"];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const uid = getUserId(req);
  if (!uid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword, confirmPassword } = await req.json().catch(() => ({}));

  // 入力バリデーション
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ message: "全ての項目を入力してください" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: "新しいパスワードと確認用が一致しません" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: "新しいパスワードは8文字以上で入力してください" }, { status: 400 });
  }

  // 現在のパスワード確認（平文比較）
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { password: true },
  });

  if (!user) {
    return NextResponse.json({ message: "ユーザーが存在しません" }, { status: 404 });
  }

  if (user.password !== currentPassword) {
    return NextResponse.json({ message: "現在のパスワードが正しくありません" }, { status: 400 });
  }

  // 新しいパスワードを平文で保存
  await prisma.user.update({
    where: { id: uid },
    data: { password: newPassword },
  });

  return NextResponse.json({ ok: true });
}
