// web/src/app/api/user_register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const SALT_ROUNDS = 10;

// 環境変数で切り替え
const HASH_ENABLED =
    (process.env.PASSWORD_HASH_ENABLED ?? "true").toLowerCase() === "true";

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        // --- 入力バリデーション ---
        if (!username || !USERNAME_RE.test(username)) {
            return NextResponse.json(
                { error: "ユーザー名は3〜20文字の半角英数字とアンダースコアのみです" },
                { status: 400 }
            );
        }

        if (!password || password.length < 8) {
            return NextResponse.json(
                { error: "パスワードは8文字以上で入力してください" },
                { status: 400 }
            );
        }

        // --- 重複チェック ---
        const exists = await prisma.user.findUnique({ where: { username } });
        if (exists) {
            return NextResponse.json(
                { error: "このユーザー名は既に登録されています" },
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
