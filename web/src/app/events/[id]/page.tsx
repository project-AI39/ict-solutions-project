import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // 常に最新を表示したい場合（任意）

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const ev = await prisma.event.findUnique({
    where: { id: params.id },
    include: { author: { select: { username: true } } },
  });
  if (!ev) return notFound();

  const date = new Date(ev.createdAt);
  const authorName = ev.author?.username ?? "unknown";

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <a href="/" className="text-sm underline mb-4 inline-block">← ホームに戻る</a>

      <h1 className="text-2xl font-semibold mb-2">{ev.title}</h1>
      <p className="text-sm text-gray-600 mb-4">
        by {authorName} ・ {date.toLocaleString()}
      </p>

      {ev.imageUrl && (
        <div className="relative w-full h-64 mb-4">
          <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover rounded-xl" />
        </div>
      )}

      {ev.description && (
        <p className="leading-relaxed whitespace-pre-wrap">{ev.description}</p>
      )}

      <div className="mt-6 text-sm text-gray-600">
        位置: {ev.latitude.toFixed(5)}, {ev.longitude.toFixed(5)}
      </div>
    </main>
  );
}
