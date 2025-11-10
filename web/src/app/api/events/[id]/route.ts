import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js 15: params は Promise で受け取る必要がある
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // await で取得
  
  const ev = await prisma.event.findUnique({
    where: { id },
    include: { author: { select: { username: true } } },
  });
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: ev.id,
    title: ev.title,
    imageUrl: ev.imageUrl,
    description: ev.description,
    latitude: ev.latitude,
    longitude: ev.longitude,
    authorName: ev.author?.username ?? "unknown",
    createdAt: ev.createdAt,
  });
}
