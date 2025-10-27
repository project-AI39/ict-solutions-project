import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ev = await prisma.event.findUnique({
    where: { id: params.id },
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
