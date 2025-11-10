// src/app/api/users/change-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

// メール形式バリデーション
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleChangeEmail(req: NextRequest) {
    const uid = getUserIdFromRequest(req);
    if (!uid) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // body を読み取る
    const body = await req.json().catch(() => ({}));

    // email / newEmail のどちらでも受理
    const raw = (body?.newEmail ?? body?.email ?? "").toString().trim().toLowerCase();

    // 入力バリデーション
    if (!raw) {
        return NextResponse.json({ message: "メールアドレスを入力してください" }, { status: 400 });
    }
    if (!EMAIL_RE.test(raw)) {
        return NextResponse.json({ message: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }

    try {
        // 更新
        await prisma.user.update({
            where: { id: uid },
            data: { email: raw },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        // unique 制約違反
        if (e?.code === "P2002") {
            return NextResponse.json(
                { message: "このメールアドレスは既に使用されています" },
                { status: 409 }
            );
        }

        console.error("POST/PATCH /api/users/change-email failed:", e);
        return NextResponse.json(
            { message: "メールアドレスの変更に失敗しました" },
            { status: 500 }
        );
    }
}

// ✅ POST / PATCH 両方受け付け
export async function POST(req: NextRequest) {
    return handleChangeEmail(req);
}
export async function PATCH(req: NextRequest) {
    return handleChangeEmail(req);
}
