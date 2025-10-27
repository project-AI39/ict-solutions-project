// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";

// JWT からユーザーIDを取り出す
function getUserId(req: NextRequest): string | null {
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const token = cookies["token"];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid?: string; userId?: string };
    return (payload.userId || payload.uid) ?? null;
  } catch {
    return null;
  }
}

// ユーザー名バリデーション
function validateUsername(name: string): string | null {
  const trimmed = name.trim().normalize("NFKC");
  if (!trimmed) return "ユーザー名を入力してください。";
  if (trimmed.length < 3 || trimmed.length > 20) return "ユーザー名は3〜20文字で入力してください。";
  if (!/^[a-zA-Z0-9_ぁ-んァ-ヶｦ-ﾟ一-龥ー]+$/.test(trimmed))
    return "ユーザー名は英数・アンダースコア・日本語のみ使用できます。";
  return null;
}

// 🔹 PATCH: ユーザー名変更
export async function PATCH(req: NextRequest) {
  const uid = getUserId(req);
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { username } = await req.json().catch(() => ({}));
  const err = validateUsername(username ?? "");
  if (err) return NextResponse.json({ message: err }, { status: 400 });

  try {
    await prisma.user.update({
      where: { id: uid },
      data: { username: username.trim().normalize("NFKC") },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ message: "ユーザー名は既に使われています" }, { status: 409 });
    }
    console.error("PATCH /api/users/me failed:", e);
    return NextResponse.json({ message: "更新に失敗しました" }, { status: 500 });
  }
}

// 🔹 DELETE: アカウント削除
export async function DELETE(req: NextRequest) {
  const uid = getUserId(req);
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    // トランザクションで安全に削除（イベントは残す）
    await prisma.$transaction(async (tx) => {
      // 1️⃣ 参加情報削除（EventParticipant）
      await tx.eventParticipant.deleteMany({ where: { userId: uid } });

      // 2️⃣ 投稿イベントの authorId を null に
      await tx.event.updateMany({
        where: { authorId: uid },
        data: { authorId: null },
      });

      // 3️⃣ ユーザー本体削除
      await tx.user.delete({ where: { id: uid } });
    });

    // トークン削除
    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("DELETE /api/users/me failed:", e);
    return NextResponse.json({ message: "削除に失敗しました" }, { status: 500 });
  }
}
