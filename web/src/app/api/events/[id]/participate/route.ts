// src/app/api/events/[id]/participate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "DEV_SECRET_KEY";
const METERS_ALLOWED = 10;
const POINTS_PER_JOIN = 10;

function getUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, JWT_SECRET) as { sub?: string; id?: string; userId?: string };
    return p.sub || p.id || p.userId || null;
  } catch {
    return null;
  }
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await ctx.params;

  // 認証 or 開発フォールバック
  let userId = getUserIdFromRequest(req);
  if (!userId && process.env.DEV_ASSUME_USER_ID) userId = process.env.DEV_ASSUME_USER_ID!;
  if (!userId) return NextResponse.json({ error: "未認証です。" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "現在地を取得できませんでした。" }, { status: 400 });
  }

  // ★ authorId を取得して「主催者」を拒否
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, latitude: true, longitude: true, authorId: true },
  });
  if (!ev) return NextResponse.json({ error: "イベントが見つかりません。" }, { status: 404 });

  if (ev.authorId && ev.authorId === userId) {
    return NextResponse.json({ error: "主催者は自身のイベントに参加できません。" }, { status: 403 });
  }

  const distance = haversineMeters(lat, lng, ev.latitude, ev.longitude);
  if (!Number.isFinite(distance) || distance > METERS_ALLOWED) {
    return NextResponse.json({ error: `会場から離れています（~${Math.round(distance)}m）。` }, { status: 403 });
  }

  const already = await prisma.eventParticipant.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { userId: true },
  });
  if (already) return NextResponse.json({ error: "すでに参加済みです。" }, { status: 409 });

  await prisma.$transaction([
    prisma.eventParticipant.create({ data: { userId, eventId } }),
    prisma.user.update({ where: { id: userId }, data: { points: { increment: POINTS_PER_JOIN } } }),
  ]);

  return NextResponse.json({ ok: true, awarded: POINTS_PER_JOIN, distance: Math.round(distance) });
}
