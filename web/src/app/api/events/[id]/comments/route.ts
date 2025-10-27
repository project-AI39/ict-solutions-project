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
    const p = jwt.verify(token, JWT_SECRET) as { userId?: string; uid?: string };
    return (p.userId || p.uid) ?? null;
  } catch {
    return null;
  }
}

// GET /api/events/[id]/comments?take=30
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }   // ★ Promise で受ける
) {
  const { id } = await ctx.params;           // ★ await 必須
  const eventId = id;

  const take = Math.min(
    50,
    Math.max(1, Number(new URL(req.url).searchParams.get("take") ?? 20))
  );

  const comments = await prisma.eventComment.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { username: true } },
    },
  });

  return NextResponse.json({ comments });
}

// POST /api/events/[id]/comments  { body }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }   // ★ Promise で受ける
) {
  const uid = getUserId(req);
  if (!uid) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;           // ★ await 必須
  const eventId = id;

  const { body } = await req.json().catch(() => ({}));
  const text = String(body ?? "").trim();

  if (!text) return NextResponse.json({ message: "コメントを入力してください" }, { status: 400 });
  if (text.length > 1000)
    return NextResponse.json({ message: "コメントは1000文字以内で入力してください" }, { status: 400 });

  const exists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!exists) return NextResponse.json({ message: "イベントが見つかりません" }, { status: 404 });

  const created = await prisma.eventComment.create({
    data: { body: text, eventId, authorId: uid },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { username: true } },
    },
  });

  return NextResponse.json({ comment: created }, { status: 201 });
}
