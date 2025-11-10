// web/src/app/api/user_register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // 追加: 最低限のメール検証
const SALT_ROUNDS = 10;

// 環境変数で切り替え
const HASH_ENABLED =
    (process.env.PASSWORD_HASH_ENABLED ?? "true").toLowerCase() === "true";

export async function POST(req: NextRequest) {
    try {
        const { username, email, password } = await req.json();

        // --- 入力バリデーション ---
        if (!username || !USERNAME_RE.test(username)) {
            return NextResponse.json(
                { error: "ユーザー名は3〜20文字の半角英数字とアンダースコアのみです" },
                { status: 400 }
            );
        }

        if (!email || !EMAIL_RE.test(email)) {
            return NextResponse.json(
                { error: "メールアドレスの形式が正しくありません" },
                { status: 400 }
            );
        }

        if (!password || password.length < 8) {
            return NextResponse.json(
                { error: "パスワードは8文字以上で入力してください" },
                { status: 400 }
            );
        }

        // 正規化（大文字小文字ゆれ対策）
        const normalizedEmail = String(email).trim().toLowerCase();

        // --- 重複チェック ---
        const exists = await prisma.user.findUnique({ where: { username } });
        if (exists) {
            return NextResponse.json(
                { error: "このユーザー名は既に登録されています" },
                { status: 409 }
            );
        }

        const byEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (byEmail) {
            return NextResponse.json(
                { error: "このメールアドレスは既に登録されています" },
                { status: 409 }
            );
        }

        // --- パスワード処理 ---
        const storedPassword = HASH_ENABLED
            ? await bcrypt.hash(password, SALT_ROUNDS)
            : password;

        // --- 登録 ---
        await prisma.user.create({
            data: {
                username,
                email: normalizedEmail,
                password: storedPassword,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error("User Register API Error:", e);
        return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
}

export function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
