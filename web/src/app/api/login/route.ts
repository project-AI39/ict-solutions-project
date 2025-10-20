// app/api/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "DEV_SECRET_KEY";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが間違っています" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "ユーザー名またはパスワードが間違っています" },
        { status: 401 }
      );
    }

    // JWT 発行
    const token = jwt.sign(
      { username: user.username, userId: user.id },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}

// ✅ GET要求などが来た場合に405を返す（任意）
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
