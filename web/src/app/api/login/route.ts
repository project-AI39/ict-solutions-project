// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

const prisma = new PrismaClient();
const HASH_ENABLED = (process.env.PASSWORD_HASH_ENABLED ?? "true").toLowerCase() === "true";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: "ユーザー名またはパスワードが間違っています" }, { status: 401 });

    // ハッシュ/平文の両対応（自動移行）
    const looksHashed = typeof user.password === "string" && /^\$2[aby]\$/.test(user.password);
    const ok = looksHashed || HASH_ENABLED
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!ok) return NextResponse.json({ error: "ユーザー名またはパスワードが間違っています" }, { status: 401 });

    // 平文→ハッシュ自動移行
    if (HASH_ENABLED && !looksHashed) {
      const newHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: newHash } });
    }

    // 標準 JWT（sub クレーム）を発行
    const token = signToken(user.id);

    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      // secure: true, // 本番は必ず true（HTTPS）
    });
    return res;
  } catch (err) {
    console.error("Login API Error:", err);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
